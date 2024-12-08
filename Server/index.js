const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Load RSA private key
const privateKey = fs.readFileSync("keys/private_key.pem", "utf8");

// API to decrypt data
app.post("/decrypt", (req, res) => {
  try {
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: "No encrypted data provided." });
    }

    console.log("Encrypted Data Received:", encryptedData);

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

// Serve public key to the client
app.get("/public_key.pem", (req, res) => {
  try {
    const publicKey = fs.readFileSync("keys/public_key.pem", "utf8");
    res.type("text/plain").send(publicKey);
  } catch (error) {
    console.error("Error fetching public key:", error);
    res.status(500).send("Failed to fetch public key");
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
