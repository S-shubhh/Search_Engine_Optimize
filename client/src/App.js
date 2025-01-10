import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query!");
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      // Fetch metadata
      const metadataResponse = await fetch(
        `http://localhost:5000/metadata?query=${encodeURIComponent(searchQuery)}`
      );
      const metadataData = await metadataResponse.json();
      setMetadata(metadataData.data);

      // Fetch Google search results
      const googleResponse = await fetch(
        `http://localhost:5000/googleSearch?query=${encodeURIComponent(searchQuery)}`
      );
      const googleData = await googleResponse.json();
      setGoogleResults(googleData.data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setShowResults(false);
    setGoogleResults([]);
    setMetadata(null);
  };

  return (
    <div className="app">
      <div className="search-container">
        <h1 className="app-title">Discover Places</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for a place"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            onClick={handleSearch}
            className="search-button"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          {searchQuery && (
            <button onClick={handleClear} className="clear-button">
              <i className="fa fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className={`results-section ${showResults ? "visible" : ""}`}>
        <div className="results-container">
          <div className="google-results-container">
            {googleResults.length > 0 && (
              <>
                <h2>Google Search Results</h2>
                {googleResults.map((result, index) => (
                  <div className="card" key={index}>
                    <a href={result.link} target="_blank" rel="noopener noreferrer">
                      <h3>{result.title}</h3>
                    </a>
                    <p>{result.snippet}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="metadata-container">
            {metadata && (
              <>
                <h2>Place Metadata</h2>
                <div className="card">
                  <h3>{metadata.name || "Unknown Place"}</h3>
                  <p>{metadata.address || "Address not available"}</p>
                  <p>
                    <strong>Why Famous:</strong> {metadata.whyFamous || "No details available"}
                  </p>
                  <div>
                    <h4>Nearby:</h4>
                    {Object.entries(metadata.nearby).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key.replace(/([A-Z])/g, " $1")}</strong>:{" "}
                        {value.length
                          ? value.map(({ name, distance }) => (
                              <p key={name}>
                                {name} - {distance}
                              </p>
                            ))
                          : "N/A"}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
