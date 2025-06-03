// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // for agents
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import AdminHome from "./pages/admin/AdminHome";
import ManageAgents from "./pages/admin/ManageAgents";
import ManageCandidates from "./pages/admin/ManageCandidates";
import ReviewIncidents from "./pages/admin/ReviewIncidents";
import Reports from "./pages/admin/Reports";

import SuperAdminLayout from "./pages/admin/SuperAdminLayout";
import SuperAdminRoute from "./components/SuperAdminRoute";
import SuperAdminHome from "./pages/admin/SuperAdminHome";
import ManageAdmins from "./pages/admin/ManageAdmins";

import Settings from "./pages/Settings"; // shared

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root -> login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Agent/Any-User Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Section */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="manage-agents" element={<ManageAgents />} />
          <Route path="manage-candidates" element={<ManageCandidates />} />
          <Route path="review-incidents" element={<ReviewIncidents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          {/* Redirect unknown admin paths back to home */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Super Admin Section (unchanged) */}
        <Route
          path="/superadmin/*"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminHome />} />
          <Route path="manage-admins" element={<ManageAdmins />} />
          <Route path="manage-agents" element={<ManageAgents />} />
          <Route path="manage-candidates" element={<ManageCandidates />} />
          <Route path="review-incidents" element={<ReviewIncidents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/superadmin" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
