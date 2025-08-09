// src/components/DashboardLayout.js
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu } from "lucide-react"; // for the hamburger icon

export default function DashboardLayout() {
  // toggle sidebar on small screens
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { to: "overview", label: "Overview" },
    { to: "votes", label: "Vote Entry" },
    { to: "incidents", label: "Incidents" },
    { to: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (desktop: fixed width; mobile: toggle) */}
      <aside
        className={`
          bg-white border-r p-4 space-y-2
          md:w-64 md:block
          ${isOpen ? "block w-64" : "hidden"}
        `}
      >
        <h1 className="text-xl font-bold mb-4">Dashboard</h1>
        <nav className="space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm hover:bg-gray-100 ${isActive ? "bg-blue-100 font-semibold" : ""
                }`
              }
              onClick={() => setIsOpen(false)} // close on mobile after click
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with hamburger on small screens */}
        <header className="bg-white border-b p-4 flex items-center md:hidden">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h2 className="ml-4 text-lg font-semibold">Dashboard</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
