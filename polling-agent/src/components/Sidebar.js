import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const links = [
        { to: "/dashboard/overview", label: "Dashboard" },
        { to: "/dashboard/votes", label: "Vote Entry" },
        { to: "/dashboard/incidents", label: "Incident Reports" },
        { to: "/dashboard/settings", label: "Settings" },
    ];

    return (
        <>
            {/* Hamburger button (mobile only) */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 text-2xl p-2 rounded bg-white shadow hover:bg-gray-100 focus:outline-none"
                aria-label="Open sidebar"
            >
                ☰
            </button>

            {/* Backdrop (mobile only, when open) */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                />
            )}

            {/* Sidebar Container */}
            <div
                className={`
          fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-lg z-40
          transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:shadow-none
        `}
            >
                {/* Close button (mobile only) */}
                <div className="md:hidden flex justify-end p-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-2xl p-1 rounded hover:bg-gray-100 focus:outline-none"
                        aria-label="Close sidebar"
                    >
                        ×
                    </button>
                </div>

                {/* Sidebar Links */}
                <nav className="flex flex-col p-4 space-y-2">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setIsOpen(false)} // close on mobile
                            className={({ isActive }) =>
                                isActive
                                    ? "px-3 py-2 rounded hover:bg-gray-100 transition bg-blue-100 font-semibold"
                                    : "px-3 py-2 rounded hover:bg-gray-100 transition"
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    );
}
