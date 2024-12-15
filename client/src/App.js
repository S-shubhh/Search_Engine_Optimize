import React, { useState } from "react";
import "./index.css";
import forge from "node-forge"; // Import node-forge for RSA encryption

const App = () => {
  const [query, setQuery] = useState(""); // State to hold the user input
  const [searchResults, setSearchResults] = useState([]); // To store search results
  const [metadata, setMetadata] = useState({}); // To store location metadata

  // Encrypt the query using RSA
  const encryptQuery = (query) => {
    const publicKeyPem = process.env.REACT_APP_PUBLIC_KEY; // Replace with your actual public key

        if (!publicKeyPem) {
          console.error("Public key not found. Make sure the .env file is configured correctly.");
        }


        const formattedKey = publicKeyPem.replace(/\\n/g, '\n').replace(/\\r/g, '');
    const publicKey = forge.pki.publicKeyFromPem(formattedKey);
    const encrypted = publicKey.encrypt(query, "RSA-OAEP", {
      md: forge.md.sha256.create(), // Use SHA-256 hashing for OAEP
    });

    return forge.util.encode64(encrypted); // Convert encrypted data to Base64
  };

  const handleSearch = async () => {
    if (!query) return; // Ensure there's a query to send

    // Encrypt the query before sending
    const encryptedQuery = encryptQuery(query);

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encryptedQuery }),
      });

      const data = await response.json();
      if (response.ok) {
        // Update state with results and metadata
        setSearchResults(data.results);
        setMetadata({
          nearestStation: data.metadata?.nearestStation || "N/A",
          nearestAirport: data.metadata?.nearestAirport || "N/A",
          famousFor: data.metadata?.famousFor || "N/A",
        });
      } else {
        console.error("Error fetching search results:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 animate-slide-in">
          Optimized Travel Search Engine
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Find relevant information and travel metadata securely. 🚀
        </p>

        <div className="mt-8">
          <label
            htmlFor="query"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Enter Your Query
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
            onClick={handleSearch}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl focus:ring-4 focus:ring-indigo-400 hover:scale-105 transition-transform duration-300"
          >
            🔍 Search
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Search Results */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-400 text-white rounded-xl shadow-md p-6 border border-indigo-500 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Search Results:</h3>
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div key={index} className="mb-4">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold underline"
                  >
                    {result.title}
                  </a>
                  <p className="text-sm mt-1">{result.snippet}</p>
                </div>
              ))
            ) : (
              <p>No results to display. Try a query above.</p>
            )}
          </div>

          {/* Right Column: Metadata */}
          <div className="bg-gradient-to-br from-pink-500 to-red-400 text-white rounded-xl shadow-md p-6 border border-pink-500 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">About the Location:</h3>
            {metadata.nearestStation ? (
              <div>
                <p><strong>Nearest Station:</strong> {metadata.nearestStation}</p>
                <p><strong>Nearest Airport:</strong> {metadata.nearestAirport}</p>
                <p><strong>Famous For:</strong> {metadata.famousFor}</p>
              </div>
            ) : (
              <p>Metadata will appear here after searching.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
