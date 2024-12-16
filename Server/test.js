const crypto = require("crypto");

// Replace this with your public key
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuNVGnlxzNc8/aRBofz1r+rZBV9v2gmW6bToDCk/2ctqAmXji468S6caLj77EiFPQepkm/DtgxikGLyMR6F/wBrioeu/u1Kjx9K3oq/2IHABIKNhe0bDKVH3E++fN+gBcDJfrzTXX/WO7ogbloEJh8nl4iR0/YRjXFlXkdI+I2cnGJ16o0pntB0AsiryVYGgFwr5BTtdAhPUwXzu/H16Hq/ObcCP2uJxmw/Cb6caB2SmUbqkEujKsg8k83kfBhSyyYhF8NYdUtiqcrDywx9Z5+IMNOiGbmzBpPzdx1UYnwq7BLpPgXbDPIwnW+fRfeeucWmT1P33S9nbPzJlMX07NewIDAQAB
-----END PUBLIC KEY-----`;

// Your plain text query
const query = "Find nearest airport from XYZ station";

// Encrypt the query
const buffer = Buffer.from(query, "utf8");
const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  buffer
);

// Convert to Base64
const encryptedQuery = encrypted.toString("base64");

console.log("Encrypted Query:", encryptedQuery);
