// src/components/AgentSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

export default function AgentSidebar({ sidebarOpen, setSidebarOpen }) {
    const links = [
        { to: "/dashboard", label: "Overview" },
        { to: "/dashboard/votes", label: "Vote Entry" },
        { to: "/dashboard/incidents", label: "Incidents" },
        { to: "/dashboard/settings", label: "Settings" },
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

            {/* 
         Sidebar now has:
         - fixed position spanning full height: `h-screen fixed inset-y-0 left-0`
         - width 64 (w-64)
         - background white, shadow
      */}
            <aside
                className={`
          fixed inset-y-0 left-0 bg-white shadow-md overflow-y-auto transition-transform duration-200 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:shadow-none w-64 h-screen
        `}
            >
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Agent Panel</h1>
                </div>
                <nav className="px-2 py-4 space-y-1">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/dashboard"}
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded text-sm hover:bg-fuchsia-100 ${isActive ? "bg-fuchsia-200 font-semibold" : ""
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
