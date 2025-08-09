// src/components/SuperAdminSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function SuperAdminSidebar({ sidebarOpen, setSidebarOpen }) {
    const links = [
        { to: "/superadmin", label: "Dashboard" },
        { to: "/superadmin/config", label: "Manage Location" },
        { to: "/superadmin/manage-candidates", label: "Manage Candidates" },
        { to: "/superadmin/manage-admins", label: "Manage Admins" },
        { to: "/superadmin/manage-agents", label: "Manage Agents" },
        { to: "/superadmin/validate-entries", label: "Validate Entries" },
        { to: "/superadmin/review-incidents", label: "Review Incidents" },
        { to: "/superadmin/reports", label: "Reports" },
        { to: "/superadmin/settings", label: "Settings" },
    ];

    return (
        <>
            {/* Mobile hamburger */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <button onClick={() => setSidebarOpen((prev) => !prev)}>
                    {sidebarOpen ? (
                        <XMarkIcon className="h-6 w-6 text-gray-700" />
                    ) : (
                        <Bars3Icon className="h-6 w-6 text-gray-700" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 bg-gray-200 shadow-md overflow-y-auto transition-transform duration-200 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:shadow-none w-64
        `}
            >
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-center">Super Admin</h1>
                </div>
                <nav className="px-2 py-4 space-y-1">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/superadmin"}
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded text-sm hover:bg-gray-100 ${isActive ? "bg-fuchsia-200 font-semibold" : ""
                                }`
                            }
                            onClick={() => setSidebarOpen(false)} // close on mobile
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
