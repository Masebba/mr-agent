// src/pages/admin/AdminLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-fuchsia-50">
            {/* Sidebar */}
            <AdminSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            {/* Main content */}
            <div className={`flex-1 flex flex-col md:pl-2 transition-all`}>
                <div className="p-4 md:p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
