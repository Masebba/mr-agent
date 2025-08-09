// src/pages/admin/AdminDashboard.js
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";

export default function AdminDashboard() {
    const links = [
        { to: "manage-agents", label: "Manage Agents" },
        //        { to: "manage-candidates", label: "Manage Candidates" },
        { to: "review-incidents", label: "Review Incidents" },
        { to: "validate-entries", label: "Validate Entries" },
        { to: "reports", label: "Reports" },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r">
                <nav className="p-4 space-y-2">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded hover:bg-fuchsia-100 ${isActive ? "bg-purple-100 font-semibold" : ""
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 bg-gray-50">
                <Outlet />
            </main>
        </div>
    );
}
