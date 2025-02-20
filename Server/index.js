require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());


const encodeQuery = (query) => encodeURIComponent(query).replace(/%20/g, "+");


// Haversine formula to calculate distance between two lat-lng points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});

const encryptionKey = process.env.AES_SECRET_KEY; // Make sure this is a 32-byte key
const iv = Buffer.alloc(16, 0); // AES requires a 16-byte IV, same as frontend


function decryptQuery(encryptedData) {
  // Extract IV and ciphertext
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

  // Hash the encryption key to 32 bytes
  const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();

  // Decrypt the ciphertext
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(ciphertext, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

app.post("/decrypt", (req, res) => {
  try {
    console.log("Received encryptedData:", req.body.encryptedQuery);
    const { encryptedQuery } = req.body;

    if (!encryptedQuery) {
      return res.status(400).json({ error: "No encrypted data provided" });
    }

    const decryptedData = decryptQuery(encryptedQuery); // Call the function with encrypted data
    res.json({ message: "Decryption successful", data: decryptedData });

  } catch (error) {
    console.error("Decryption error:", error.message);
    res.status(500).json({ error: "Decryption failed", details: error.message });
  }
});


app.get("/googleSearch", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    const encodedQuery = encodeQuery(query);
 

    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?q=${encodedQuery}&key=${apiKey}&cx=${cx}`
    );

  
    const results = response.data.items.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    res.json({ message: "Google search results fetched", data: results });
  } catch (error) {
    console.error('Google Search Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: "Failed to fetch Google search results",
      details: error.response ? error.response.data : error.message,
    });
  }
});


app.get("/metadata", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const apiKey = process.env.GOOGLE_PLACES_API;
    const baseUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";

    
    const metadataResponse = await axios.get(`${baseUrl}?query=${encodeURIComponent(query)}&key=${apiKey}`);
    const place = metadataResponse.data.results[0];

    if (!place) {
      return res.status(404).json({ error: "No place found for the given query." });
    }

    const { place_id, name, formatted_address, geometry } = place;
    const lat = geometry.location.lat;
    const lng = geometry.location.lng;

   
    const detailsResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}`
    );
    const details = detailsResponse.data.result;
    const whyFamous = details.editorial_summary?.overview || "Details not available.";

    
    const types = ["train_station", "bus_station", "airport"];
    const nearbyPromises = types.map((type) =>
      axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100000&type=${type}&key=${apiKey}`
      )
    );
    const nearbyResponses = await Promise.all(nearbyPromises);

    const nearby = {
      railwayStation: nearbyResponses[0]?.data?.results.slice(0, 3).map((r) => ({
        name: r.name,
        address: r.vicinity,
        distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
      })) || [],
      busStation: nearbyResponses[1]?.data?.results.slice(0, 3).map((r) => ({
        name: r.name,
        address: r.vicinity,
        distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
      })) || [],
      airport: nearbyResponses[2]?.data?.results
        .filter((r) => r.types.includes("airport"))
        .slice(0, 1)
        .map((r) => ({
          name: r.name,
          address: r.vicinity,
          distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
        })) || [{ name: "No airports found nearby", address: "N/A", distance: "N/A" }],
    };

    
    const truncatedWhyFamous = whyFamous;


    res.json({
      message: "Metadata fetched successfully",
      data: {
        name,
        address: formatted_address,
        whyFamous: truncatedWhyFamous,
        nearby,
      },
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ error: "Failed to fetch metadata", details: error.message });
  }
});


app.use(limiter);


// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

