const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios"); // For making API requests
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA private key
const privateKey = fs.readFileSync("keys/private_key.pem", "utf8");

// Google Custom Search API configuration
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY; // Replace with your actual API key
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID; // Replace with your actual search engine ID
const GOOGLE_PLACES = process.env.GOOGLE_PLACES_API;


console.log("Google API Key:", GOOGLE_SEARCH_API_KEY);
console.log("Google Engine ID:", GOOGLE_SEARCH_ENGINE_ID);

// Decrypt function to handle encrypted queries
const decryptQuery = (encryptedQuery) => {
  const encryptedBuffer = Buffer.from(encryptedQuery, "base64");
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedBuffer
  );
  return decryptedBuffer.toString("utf8");
};

// API to handle search queries
app.post("/api/search", async (req, res) => {
  try {
    const { encryptedQuery } = req.body;
    const query = encryptedQuery; // added this line

    // commented this line
    // if (!encryptedQuery) {
    //   return res.status(400).json({ error: "No encrypted query provided." });
    // }

    console.log("Encrypted Query Received:", encryptedQuery);

    //  commmenting this .  Decrypt the query
    // const decryptedQuery = decryptQuery(encryptedQuery);
    // console.log("Decrypted Query:", decryptedQuery);

    // Use Google Custom Search API to get results
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: query,  // replace decreyptedquery wit hquery
      },
    });

    // Send results back to the client
    const results = response.data.items.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    console.log("Search Results:", results);

    res.json({
      message: "Search successful",
      query: query,  // replace decreyptedquery wit hquery
       results,
    });
  } catch (error) {
    console.error("Error processing search:", error);
    res.status(500).json({ error: "Failed to process search query" });
  }
});

app.get("/api/places", async (req, res) => {
  try {
    const { query } = req.query; // get query from the query parameters (from URL)

    if (!query) {
      return res.status(400).json({ error: "Query not provided." });
    }

    // Use Google Places API to fetch place details
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
      params: {
        key: GOOGLE_PLACES, // use the second API key here
        query: query, // pass the query parameter here
      },
    });

    console.log("Google Places API Response:", response.data);

    // Process response to get useful data (formatted address, geometry, types, photos, etc.)
    const places = response.data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      location: place.geometry.location,
      photos: place.photos,
      types: place.types, // Including types
      rating: place.rating, // Including rating if available
      placeId: place.place_id, // Including placeId for more details if needed
    }));

    res.json({
      message: "Places fetched successfully",
      places: places,
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: "Failed to fetch places." });
  }
});




// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
