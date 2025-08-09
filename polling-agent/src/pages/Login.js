// src/pages/Login.js
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignOut = async () => {
    await signOut(auth);
  };
  // 1) If already logged in, redirect based on role
  useEffect(() => {
    if (currentUser) {
      if (role === "superadmin") {
        navigate("/superadmin", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "agent") {
        navigate("/dashboard", { replace: true });
      } else {
        auth.signOut(); // unknown role—force sign out
      }
    }
  }, [currentUser, role, navigate]);

  // 2) Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext.onAuthStateChanged will fire, set role, and then useEffect() triggers redirect
    } catch (err) {
      console.error("Login error:", err);
      // Display a friendly message
      if (err.code === "auth/user-not-found") {
        setErrorMsg("No user found with that email.");
      } else if (err.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Invalid email address.");
      } else {
        setErrorMsg("Failed to sign in. " + err.message);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-40 bg-fuchsia-100">
      <h1 className="text-2xl font-bold mb-6">Lira Election Polling Agent</h1>
      <h1 className="text-xl font-semibold mb-4">Log In</h1>
      {currentUser && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
          You are currently signed in as <strong>{currentUser.email}</strong>.
          <button
            onClick={handleSignOut}
            className="ml-4 text-fuchsia-600 hover:underline"
          >
            Sign Out
          </button>
        </div>
      )}


      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
          {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-fuchsia-900 text-white p-2 rounded hover:bg-fuchsia-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
