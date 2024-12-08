import React, { useState } from "react";

const App = () => {
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const encryptData = async (data) => {
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

    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  };

  const handleEncryptAndSend = async () => {
    const secretMessage = "This is a secret message!";
    const encryptedData = await encryptData(secretMessage);

    console.log("Encrypted Data:", encryptedData);

    // Send the encrypted data to the server
    const response = await fetch("http://localhost:5000/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedData }),
    });

    const result = await response.json();
    setDecryptedMessage(result.data);
  };

  return (
    <div>
      <h1>End-to-End Encryption</h1>
      <button onClick={handleEncryptAndSend}>Encrypt and Send</button>
      <p>Decrypted Message: {decryptedMessage}</p>
    </div>
  );
};

export default App;
