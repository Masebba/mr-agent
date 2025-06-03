// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    // Not logged in → redirect to Login
    return <Navigate to="/login" replace />;
  }
  return children;
}
