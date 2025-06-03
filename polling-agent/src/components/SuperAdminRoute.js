// src/components/SuperAdminRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminRoute({ children }) {
  const { currentUser, role } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (role !== "superadmin") {
    // Deny access
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
