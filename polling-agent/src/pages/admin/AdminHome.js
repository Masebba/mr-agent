// src/pages/admin/AdminHome.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminHome() {
    const [counts, setCounts] = useState({
        totalAgents: 0,
        totalVotes: 0,
        totalIncidents: 0,
        totalCandidates: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCounts() {
            setLoading(true);

            // 1) Count agents
            const agentsSnap = await getDocs(
                collection(db, "users")
            );
            let agentCount = 0;
            agentsSnap.docs.forEach((d) => {
                if (d.data().role === "agent") agentCount++;
            });

            // 2) Count votes
            const votesSnap = await getDocs(collection(db, "votes"));
            const voteCount = votesSnap.size;

            // 3) Count incidents
            const incSnap = await getDocs(collection(db, "incidents"));
            const incCount = incSnap.size;

            // 4) Count candidates
            const candSnap = await getDocs(collection(db, "candidates"));
            const candCount = candSnap.size;

            setCounts({
                totalAgents: agentCount,
                totalVotes: voteCount,
                totalIncidents: incCount,
                totalCandidates: candCount,
            });
            setLoading(false);
        }

        fetchCounts();
    }, []);

    if (loading) {
        return <p className="text-sm text-gray-600">Loading dashboard…</p>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Agents</span>
                    <span className="text-2xl font-semibold mt-2">{counts.totalAgents}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Votes</span>
                    <span className="text-2xl font-semibold mt-2">{counts.totalVotes}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Incidents</span>
                    <span className="text-2xl font-semibold mt-2">{counts.totalIncidents}</span>
                </div>
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Candidates</span>
                    <span className="text-2xl font-semibold mt-2">{counts.totalCandidates}</span>
                </div>
            </div>
        </div>
    );
}
