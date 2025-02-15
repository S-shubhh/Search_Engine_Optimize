import React, { useState , useEffect } from "react";
import "./App.css";
import { signInWithGoogle, signOutUser } from "./services/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CryptoJS from "crypto-js";
const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null); 
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


  const encryptionKey = process.env.REACT_APP_SECRET_KEY;

  const encryptQuery = (query) => {
    // Generate a random 16-byte IV
    const iv = CryptoJS.lib.WordArray.random(16);
  
    // Hash the encryption key to 32 bytes
    const keyHash = CryptoJS.SHA256(encryptionKey);
  
    // Encrypt the query
    const encrypted = CryptoJS.AES.encrypt(query, keyHash, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  
    // Return IV and ciphertext
    return {
      iv: iv.toString(CryptoJS.enc.Base64),
      ciphertext: encrypted.toString(),
    };
  };
  
  const handleSearch = async () => {
    console.log("handleSearch function triggered");
  
    if (!searchQuery.trim()) {
      alert("Please enter a search query!");
      return;
    }
  
    setLoading(true);
    setShowResults(false);
  
    try {
      // Encrypt the search query
      const encryptedQuery = encryptQuery(searchQuery);
      console.log("Encrypted Query:", encryptedQuery);  // Debugging
  
      // Send encrypted query to backend for decryption
      console.log("Sending encrypted query to backend:", encryptedQuery);
      const response = await fetch("http://localhost:5000/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedQuery: encryptedQuery }),
      });
  
      const decryptedData = await response.json();
      console.log("Decrypted Query:", decryptedData.data);
  
      // Fetch metadata and Google search results using the decrypted query
      const metadataResponse = await fetch(
        `http://localhost:5000/metadata?query=${encodeURIComponent(decryptedData.data)}`
      );
      const metadataData = await metadataResponse.json();
      setMetadata(metadataData.data);
  
      const googleResponse = await fetch(
        `http://localhost:5000/googleSearch?query=${encodeURIComponent(decryptedData.data)}`
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
