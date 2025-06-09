// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
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
// 2) Initialize Firebase
const app = initializeApp(firebaseConfig);
// 3) Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => { });
// 4) Initialize & export Functions (for createAuthUser)
export const functions = getFunctions(app);
export { app };