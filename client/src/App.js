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
        {googleResults.length > 0 && (
          <div className="results-container">
            <div className="google-results">
              <h2>Related Sites</h2>
              <ul>
                {googleResults.map((result, index) => (
                  <li key={index}>
                    <a href={result.link} target="_blank" rel="noopener noreferrer">
                      <h3>{result.title}</h3>
                    </a>
                    <p>{result.snippet}</p>
                  </li>
                ))}
              </ul>
            </div>

            {metadata && (
              <div className="metadata">
                <h2>Metadata</h2>
                <h3>{metadata.name}</h3>
                <p>{metadata.address}</p>
                <p>
                  <strong>Why Famous:</strong> {metadata.whyFamous}
                </p>
                <h4>Nearby:</h4>
                <ul>
                  <li>
                    <strong>Railway Station:</strong> {metadata.nearby.railwayStation.length
                      ? metadata.nearby.railwayStation.map((station) => (
                          <p key={station.name}>{station.name} - {station.distance}</p>
                        ))
                      : "N/A"}
                  </li>
                  <li>
                    <strong>Bus Station:</strong> {metadata.nearby.busStation.length
                      ? metadata.nearby.busStation.map((station) => (
                          <p key={station.name}>{station.name} - {station.distance}</p>
                        ))
                      : "N/A"}
                  </li>
                  <li>
                    <strong>Airport:</strong> {metadata.nearby.airport.length
                      ? metadata.nearby.airport.map((airport) => (
                          <p key={airport.name}>{airport.name} - {airport.distance}</p>
                        ))
                      : "N/A"}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
