const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA private key
const privateKey = fs.readFileSync("keys/private_key.pem", "utf8");

// Endpoint to decrypt data
app.post("/decrypt", (req, res) => {
  try {
    const { encryptedData } = req.body;
    console.log("Encrypted Query:", encryptedData);

    // Decrypt data using the private key
    const encryptedBuffer = Buffer.from(encryptedData, "base64");
    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    );

    const decryptedData = decryptedBuffer.toString("utf8");
    console.log("Decrypted Data:", decryptedData);

    res.json({ message: "Decryption successful", data: decryptedData });
  } catch (error) {
    console.error("Error decrypting data:", error);
    res.status(500).json({ error: "Failed to decrypt data" });
  }
});

// Endpoint to fetch metadata from Google APIs
app.get("/metadata", async (req, res) => {
  try {
    const { query } = req.query; // User's query from the frontend
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    console.log("Fetching metadata for query:", query);

    // Access the API key from environment variables
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Google API key is not configured" });
    }

    // Example: Fetch nearest place details using Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${googleApiKey}`;

    const response = await axios.get(placesUrl);

    if (response.data.status !== "OK") {
      return res
        .status(500)
        .json({ error: "Failed to fetch data from Google API", details: response.data });
    }

    // Return the relevant data from the API response
    const metadata = response.data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      types: place.types,
    }));

    console.log("Fetched Metadata:", metadata);

    res.json({ message: "Metadata fetched successfully", data: metadata });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
