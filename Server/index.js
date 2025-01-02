require("dotenv").config();

const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA private key from .env
const privateKey = process.env.PRIVATE_KEY;
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

// Endpoint: Decrypt encrypted queries
app.post("/decrypt", (req, res) => {
  try {
    const { encryptedData } = req.body;

    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedData, "base64")
    );

    const decryptedData = decryptedBuffer.toString("utf8");
    res.json({ message: "Decryption successful", data: decryptedData });
  } catch (error) {
    res.status(500).json({ error: "Decryption failed", details: error.message });
  }
});

// Endpoint: Fetch metadata from Google Places API
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
      railwayStation: nearbyResponses[0].data.results.slice(0, 3).map((r) => ({
        name: r.name,
        address: r.vicinity,
        distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
      })),
      busStation: nearbyResponses[1].data.results.slice(0, 3).map((r) => ({
        name: r.name,
        address: r.vicinity,
        distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
      })),
      airport: nearbyResponses[2].data.results
        .filter((r) =>
          r.types.includes("airport") &&
          (
            r.name.toLowerCase().includes("airport") ||
            r.name.toLowerCase().includes("international")
          )
        )
        .slice(0, 1)
        .map((r) => ({
          name: r.name,
          address: r.vicinity,
          distance: calculateDistance(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(2) + " km",
        })),
    };

    if (nearby.airport.length === 0) {
      nearby.airport = [{ name: "No airports found nearby", address: "N/A", distance: "N/A" }];
    }

    const truncatedWhyFamous = whyFamous.length > 200 ? whyFamous.substring(0, 200) + "..." : whyFamous;

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
    res.status(500).json({ error: "Failed to fetch metadata", details: error.message });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
