const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios"); // For making API requests

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA private key
const privateKey = fs.readFileSync("keys/private_key.pem", "utf8");

// Google Custom Search API configuration
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY; // Replace with your actual API key
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID; // Replace with your actual search engine ID

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
    if (!encryptedQuery) {
      return res.status(400).json({ error: "No encrypted query provided." });
    }

    console.log("Encrypted Query Received:", encryptedQuery);

    // Decrypt the query
    const decryptedQuery = decryptQuery(encryptedQuery);
    console.log("Decrypted Query:", decryptedQuery);

    // Use Google Custom Search API to get results
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: decryptedQuery,
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
      query: decryptedQuery,
      results,
    });
  } catch (error) {
    console.error("Error processing search:", error);
    res.status(500).json({ error: "Failed to process search query" });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
