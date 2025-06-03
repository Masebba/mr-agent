import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex bg-gray-50 pt-12 md:pt-0">
      {/* Sidebar component handles both desktop and mobile behaviors */}
      <Sidebar />

      {/* 
        On desktop: add margin-left equal to sidebar width (w-64 = 16rem = 256px).
        On mobile: no margin-left, but add top padding so content sits below the fixed hamburger.
      */}
      <main className="flex-1 md:ml-4 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
