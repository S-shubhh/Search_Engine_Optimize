import React, { useState , useEffect } from "react";
import "./App.css";
import { signInWithGoogle, signOutUser } from "./services/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";


const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null); // State for logged-in user

  const auth = getAuth();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log("User is signed in:", currentUser);
      } else {
        setUser(null);
        console.log("No user is signed in.");
      }
    });
    return () => unsubscribe();
  }, [auth]);



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

      
        if (user) {
          console.log("Search performed by user:", user.displayName);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFirstLetter = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        console.log("User logged in:", loggedInUser);
      }
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setGoogleResults([]);
      setMetadata(null);
      alert("You have been logged out.");
    } catch (error) {
      console.error("Error during logout:", error);
    }
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
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            className="search-button"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
 {/* Authentication */} 
      <div className="login-button">
  {!user ? (
    <button onClick={handleGoogleLogin} className="login-button">
      Log in with Google
    </button>
  ) : (
    <button onClick={handleLogout} className="logout-button">
      Log out
    </button>
  )}
</div>



      {/* Conditional Rendering for Results */}
      {showResults && (
        <div className="results-section visible">
          <div className="results-container">
            <div className="google-results-container">
              {googleResults.length > 0 && (
                <>
                  <h2>Google Search Results</h2>
                  {googleResults.map((result, index) => (
                    <div className="card" key={index}>
                      <div className="result-content">
                        {/* Left side: Site Logo */}
                        <div className="result-logo">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${result.link}`}
                            alt="Logo"
                          />
                        </div>

                        {/* Right side: Site Name, Link, and Description */}
                        <div className="result-info">
                          <h3 className="site-name">
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {result.title || "Website Name"}
                            </a>
                          </h3>
                          <p className="site-link">
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {result.link}
                            </a>
                          </p>
                          <h4 className="site-heading">
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {result.snippet}
                            </a>
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="metadata-container">
              {metadata && (
                <>
                  <h2>About {searchQuery || "Location"}</h2>
                  <div className="card">
                    <h3>{metadata.name || "Unknown Place"}</h3>
                    <p>{metadata.address || "Address not available"}</p>
                    <p>
                      <strong>Significance:</strong>{" "}
                      {metadata.whyFamous || "No details available"}
                    </p>
                    <div>
                      <h4 style={{ color: "#ff7e5f" }}>Nearby:</h4>
                      {Object.entries(metadata.nearby).map(([key, value]) => (
                        <div key={key}>
                          <strong>
                            {capitalizeFirstLetter(
                              key.replace(/([A-Z])/g, " $1")
                            )}
                          </strong>
                          :{" "}
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
      )}
    </div>
  );
};

export default App;
