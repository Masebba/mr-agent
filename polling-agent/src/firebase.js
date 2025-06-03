// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// 1) Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeWNy6_I7aDzrQv9XR0dBTIu56lHOOHI4",
  authDomain: "mr-agent-25c1d.firebaseapp.com",
  projectId: "mr-agent-25c1d",
  storageBucket: "mr-agent-25c1d.firebasestorage.app",
  messagingSenderId: "456622068114",
  appId: "1:456622068114:web:41a38e4f89882472d0b14b"
  // …other keys…
};

// 2) Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 3) Export Auth & Firestore
export const auth = getAuth(app);

export const db = getFirestore(app);
// Enable offline persistence (optional warning suppressed)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("IndexedDB persistence not enabled:", err.message);
});

// 4) Export Functions (only once)
export const functions = getFunctions(app);

// 5) If in development, connect to the local emulator
if (process.env.NODE_ENV === "development") {
  // The emulator must be running: `firebase emulators:start --only functions`
  connectFunctionsEmulator(functions, "localhost", 5001);
}