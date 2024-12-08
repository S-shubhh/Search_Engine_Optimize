import React, { useState } from "react";
import './index.css';


const App = () => {
  const [query, setQuery] = useState(""); // State to hold the user input
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const encryptData = async (data) => {
    try {
      // Fetch the public key
      const publicKeyResponse = await fetch("http://localhost:5000/public_key.pem");
      const publicKey = await publicKeyResponse.text();
      console.log("Fetched Public Key:", publicKey);

      const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const publicKeyBase64 = publicKey
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\n/g, "");
    const publicKeyBinary = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

    // Import the public key for encryption
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBinary,
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      false,
      ["encrypt"]
    );

      // Encrypt the data using the public key
      const buffer = new TextEncoder().encode(data);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      cryptoKey,
      buffer
    );


      return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    } catch (error) {
      console.error("Failed to encrypt the query:", error); // Log error
      throw new Error("Encryption failed");
    }
  };

  const handleEncryptAndSend = async () => {
    try {
      console.log("Query to encrypt:", query);
      const encryptedData = await encryptData(query);

      console.log("Encrypted Data:", encryptedData);

      // Send the encrypted data to the server
      const response = await fetch("http://localhost:5000/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedData }),
      });

      const result = await response.json();
      setDecryptedMessage(result.data);
    } catch (error) {
      console.error("Error during encryption and send:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 animate-slide-in">
          Secure Travel Queries
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Encrypt your travel-related queries with top-notch security. 🌍
        </p>

        <div className="mt-8">
          <label
            htmlFor="query"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Your Travel Query
          </label>
          <input
            id="query"
            type="text"
            placeholder="E.g., nearest airport from XYZ station"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-pink-400 transition-shadow shadow-md"
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleEncryptAndSend}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl focus:ring-4 focus:ring-indigo-400 hover:scale-105 transition-transform duration-300"
          >
            🔐 Encrypt & Send
          </button>
        </div>

        {decryptedMessage && (
          <div
            className="mt-8 p-6 bg-gradient-to-br from-purple-600 to-indigo-400 text-white rounded-xl shadow-md border border-indigo-500 animate-fade-in"
          >
            <h3 className="text-lg font-semibold">Decrypted Message:</h3>
            <p className="mt-2 break-words">{decryptedMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
    
};

export default App;
