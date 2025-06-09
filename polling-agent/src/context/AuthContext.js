// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthStateChanged → user =", user);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          console.log("Fetched userDoc.exists =", userSnap.exists);
          if (!userSnap.exists()) {
            console.log("No Firestore doc for this user. Signing out.");
            await signOut(auth);
            setCurrentUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          const data = userSnap.data();
          console.log("userDoc data =", data);
          if (data.disabled) {
            console.log("User is disabled. Signing out.");
            await signOut(auth);
            setCurrentUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          setCurrentUser(user);
          setRole(data.role);
          console.log("Setting currentUser & role:", data.role);
        } catch (err) {
          console.error("Error fetching userDoc:", err);
          await signOut(auth);
          setCurrentUser(null);
          setRole(null);
        }
      } else {
        console.log("No authenticated user.");
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, role };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
