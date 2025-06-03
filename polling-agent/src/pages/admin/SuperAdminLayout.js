// src/pages/admin/SuperAdminLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../../components/SuperAdminSidebar";

export default function SuperAdminLayout() {
    // Control sidebar open state on mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <SuperAdminSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main content: push right when sidebar is open on desktop (md:pl-64) */}
            <div className={`flex-1 flex flex-col md:pl-2 transition-all`}>
                <div className="p-4 md:p-6">
                    {/* Render whatever nested route is active */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
