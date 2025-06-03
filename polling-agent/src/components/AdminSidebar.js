// src/components/AdminSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
    const links = [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/manage-agents", label: "Manage Agents" },
        { to: "/admin/manage-candidates", label: "Manage Candidates" },
        { to: "/admin/review-incidents", label: "Review Incidents" },
        { to: "/admin/reports", label: "Reports" },
        { to: "/admin/settings", label: "Settings" },
    ];

    return (
        <>
            {/* Mobile hamburger */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <button
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    className="text-2xl"
                >
                    {sidebarOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 bg-white shadow-md overflow-y-auto transition-transform duration-200 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:shadow-none w-64
        `}
            >
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Admin</h1>
                </div>
                <nav className="px-2 py-4 space-y-1">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/admin"}
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded text-sm hover:bg-gray-100 ${isActive ? "bg-blue-100 font-semibold" : ""
                                }`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
