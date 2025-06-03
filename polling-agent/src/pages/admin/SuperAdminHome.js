// src/pages/admin/SuperAdminHome.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function SuperAdminHome() {
    const [analytics, setAnalytics] = useState({
        totalVotes: 0,
        totalIncidents: 0,
        totalAdmins: 0,
        totalAgents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            // 1) Count votes
            const votesSnap = await getDocs(collection(db, "votes"));
            const totalVotes = votesSnap.size;

            // 2) Count incidents
            const incSnap = await getDocs(collection(db, "incidents"));
            const totalIncidents = incSnap.size;

            // 3) Count admins & agents
            const usersSnap = await getDocs(collection(db, "users"));
            let admins = 0;
            let agents = 0;
            usersSnap.docs.forEach((doc) => {
                const data = doc.data();
                if (data.role === "admin") admins++;
                if (data.role === "agent") agents++;
            });

            setAnalytics({ totalVotes, totalIncidents, totalAdmins: admins, totalAgents: agents });
            setLoading(false);
        }

        fetchAnalytics();
    }, []);

    if (loading) {
        return <p className="text-sm text-gray-600">Loading analytics…</p>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Votes</span>
                    <span className="text-2xl font-semibold mt-2">{analytics.totalVotes}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Incidents</span>
                    <span className="text-2xl font-semibold mt-2">{analytics.totalIncidents}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Admins</span>
                    <span className="text-2xl font-semibold mt-2">{analytics.totalAdmins}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Agents</span>
                    <span className="text-2xl font-semibold mt-2">{analytics.totalAgents}</span>
                </div>
            </div>
        </div>
    );
}
