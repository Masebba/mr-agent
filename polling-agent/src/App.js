// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // for agents
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import AdminHome from "./pages/admin/AdminHome";
import ManageAgents from "./pages/admin/ManageAgents"; // shared
import ManageCandidates from "./pages/admin/ManageCandidates"; // shared
import ReviewIncidents from "./pages/admin/ReviewIncidents"; // shared
import Reports from "./pages/admin/Reports";

import SuperAdminLayout from "./pages/admin/SuperAdminLayout";
import SuperAdminRoute from "./components/SuperAdminRoute";
import SuperAdminHome from "./pages/admin/SuperAdminHome";
import ManageAdmins from "./pages/admin/ManageAdmins"; // shared
import ManageConfig from "./pages/admin/ManageConfig";
import Settings from "./pages/Settings"; // shared

import AgentLayout from "./pages/AgentLayout";
import Overview from "./pages/Overview";
import Votes from "./pages/Votes";
import Incidents from "./pages/Incidents";
import ValidateEntries from "./pages/admin/ValidateEntries";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root -> login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Agent/Any-User Dashboard */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
        />

        {/* Admin Section */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
        >
          <Route index element={<AdminHome />} />
          <Route path="validate-entries" element={<ValidateEntries />} />
          <Route path="manage-agents" element={<ManageAgents />} />
          <Route path="manage-candidates" element={<ManageCandidates />} />
          <Route path="review-incidents" element={<ReviewIncidents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          {/* Redirect unknown admin paths back to home */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Super Admin Section */}
        <Route path="/superadmin/*" element={
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        }
        >
          <Route index element={<SuperAdminHome />} />
          <Route path="validate-entries" element={<ValidateEntries />} />
          <Route path="manage-admins" element={<ManageAdmins />} />
          <Route path="manage-agents" element={<ManageAgents />} />
          <Route path="manage-candidates" element={<ManageCandidates />} />
          <Route path="review-incidents" element={<ReviewIncidents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="config" element={<ManageConfig />} />
          <Route path="*" element={<Navigate to="/superadmin" replace />} />
        </Route>

        {/* Agent section (any signed‐in “agent” or “admin” can see) */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <AgentLayout />
          </ProtectedRoute>
        }
        >
          <Route index element={<Overview />} />
          <Route path="votes" element={<Votes />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="settings" element={<Settings />} />
          {/* Catch‐all: redirect unknown /dashboard paths to /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
