import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query!");
      return;
    }

    setLoading(true);

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
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="search-container">
        <h1 className="app-title">Discover Places</h1>
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
      </div>

      <div className="results-section">
        {/* Google search results */}
        <div className="google-results">
          <h2>Related Sites</h2>
          {googleResults.length > 0 ? (
            <ul>
              {googleResults.map((result, index) => (
                <li key={index} className="google-item">
                  <a href={result.link} target="_blank" rel="noopener noreferrer">
                    <h3>{result.title}</h3>
                  </a>
                  <p>{result.snippet}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No related sites found.</p>
          )}
        </div>

        {/* Metadata section */}
        <div className="metadata">
          <h2>Metadata</h2>
          {metadata ? (
            <div>
              <h3>{metadata.name}</h3>
              <p>{metadata.address}</p>
              <p>
                <strong>Why Famous:</strong> {metadata.whyFamous}
              </p>

              {/* Nearby stations and airports */}
              <h4>Nearby:</h4>
              <ul>
                <li>
                  <strong>Railway Station:</strong>
                  {metadata.nearby.railwayStation.length > 0
                    ? metadata.nearby.railwayStation.map((station, index) => (
                        <div key={index}>
                          <p>{station.name}</p>
                          <p>{station.distance}</p>
                        </div>
                      ))
                    : "N/A"}
                </li>
                <li>
                  <strong>Bus Station:</strong>
                  {metadata.nearby.busStation.length > 0
                    ? metadata.nearby.busStation.map((station, index) => (
                        <div key={index}>
                          <p>{station.name}</p>
                          <p>{station.distance}</p>
                        </div>
                      ))
                    : "N/A"}
                </li>
                <li>
                  <strong>Airport:</strong>
                  {metadata.nearby.airport.length > 0
                    ? metadata.nearby.airport.map((airport, index) => (
                        <div key={index}>
                          <p>{airport.name}</p>
                          <p>{airport.distance}</p>
                        </div>
                      ))
                    : "N/A"}
                </li>
              </ul>
            </div>
          ) : (
            <p>No metadata available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
