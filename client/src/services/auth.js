import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "./firebase"; 
// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Function for Google Sign-In
export const signInWithGoogle = async () => {
  try {
    // Log the sign-in initiation
    console.log("Initiating Google sign-in...");

    // Perform Google Sign-In using Popup
    const result = await signInWithPopup(auth, provider);
    
    // Get user info from result
    const user = result.user;
    console.log("User signed in:", user);
    
    // You can display or use the user's info here (e.g., name, email, profile pic)
    alert(`Signed in as: ${user.displayName}`);
    
    // Return the user object
    return user;
  } catch (error) {
    // Handle error during sign-in
    console.error("Error signing in with Google:", error);
    alert("Sign-in failed. Please try again.");
  }
};

// Function for Sign-Out
export const signOutUser = async () => {
  try {
    // Sign the user out
    await auth.signOut();
    console.log("User signed out successfully.");
    alert("Successfully signed out!");
  } catch (error) {
    // Handle error during sign-out
    console.error("Error signing out:", error);
  }
};
