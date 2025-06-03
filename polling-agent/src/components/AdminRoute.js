// src/components/AdminRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, role } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // Allow only “admin” or “superadmin”
  if (role !== "admin" && role !== "superadmin") {
    // If an agent tries to visit, send them back to their Dashboard
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
