{/*
// src/pages/admin/SuperAdminDashboard.js
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function SuperAdminDashboard() {
  const links = [
    { to: "/superadmin/manage-admins", label: "Manage Admins" },
    { to: "/superadmin/manage-agents", label: "Manage Agents" },
    { to: "/superadmin/manage-candidates", label: "Manage Candidates" },
    { to: "/superadmin/review-incidents", label: "Review Incidents" },
    { to: "/superadmin/reports", label: "Reports" },
    { to: "/superadmin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex bg-fuchsia-50">
      {/* Sidebar *
      <aside className="w-64 bg-white border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold">Super Admin</h1>
        </div>
        <nav className="px-2 space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded text-sm hover:bg-fuchsia-100 ${isActive ? "bg-purple-200 font-semibold" : ""
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content *
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

*/}