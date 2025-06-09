// src/pages/AgentLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AgentSidebar from "../components/AgentSidebar";

export default function AgentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-fuchsia-50">
      {/* Sidebar */}
      <AgentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content: flex-1 fills remaining width, overflow-y-auto makes it scroll */}
      <div className="flex-1 flex flex-col md:pl-2">
        {/* 
          The container below has overflow-y-auto and full height,
          so only this right‐hand side scrolls.
        */}
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
