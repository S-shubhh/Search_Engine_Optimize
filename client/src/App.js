import React, { useState } from "react";
import './App.css'; // Importing the app-specific styles

const App = () => {
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false); // State to track loading status

  const encryptData = async (data) => {
    try {
      console.log("Starting encryption...");

      // Fetch the public key
      const publicKeyResponse = await fetch("/public_key.pem");
      const publicKeyPem = await publicKeyResponse.text();

      // Convert PEM format to ArrayBuffer
      const publicKeyBase64 = publicKeyPem
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\n/g, "");
      const publicKeyArrayBuffer = Uint8Array.from(
        atob(publicKeyBase64),
        (c) => c.charCodeAt(0)
      );

      // Import the public key
      const cryptoKey = await crypto.subtle.importKey(
        "spki",
        publicKeyArrayBuffer.buffer,
        {
          name: "RSA-OAEP",
          hash: { name: "SHA-256" },
        },
        false,
        ["encrypt"]
      );

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        new TextEncoder().encode(data)
      );

      const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      console.log("Encrypted Data:", encryptedData);
      return encryptedData;
    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Encryption failed. Please try again.");
    }
  };

  const handleEncryptAndSend = async () => {
    if (!userMessage) {
      alert("Please enter a message!");
      return;
    }

    setLoading(true); // Show loading spinner during the request

    const encryptedData = await encryptData(userMessage);
    if (!encryptedData) return;

    try {
      console.log("Sending encrypted data to server...");

      // Send the encrypted data to the server
      const response = await fetch("http://localhost:5000/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedData }),
      });

      const result = await response.json();
      setDecryptedMessage(result.data);
      console.log("Server Response:", result);
    } catch (error) {
      console.error("Request failed:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setLoading(false); // Hide loading spinner after the request
    }
  };

  return (
    <div className="container">
      <h1 className="header">End-to-End Encryption</h1>
      <input
        type="text"
        placeholder="Enter your message"
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        className="input"
      />
      <button
        onClick={handleEncryptAndSend}
        className="button"
        disabled={loading}
      >
        {loading ? "Encrypting..." : "Encrypt and Send"}
      </button>
      <div className="result-container">
        {decryptedMessage && (
          <p className="decrypted-message">Decrypted Message: {decryptedMessage}</p>
        )}
      </div>
    </div>
  );
};

export default App;
