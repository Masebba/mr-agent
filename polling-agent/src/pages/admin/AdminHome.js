// src/pages/admin/AdminHome.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useConfig } from "../../context/ConfigContext";

export default function AdminHome() {
    // defensive consumption of context
    const cfg = useConfig();
    const { districts = [], positions = [] } = cfg || {};

    const [filters, setFilters] = useState({
        position: "",
        district: "",
    });

    const [counts, setCounts] = useState({
        totalAgents: 0,
        totalVotes: 0,
        totalIncidents: 0,
        totalCandidates: 0,
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    // compute default position/district safely (no ?? mixed with ||)
    const computeDefaultPosition = () => {
        if (!positions || positions.length === 0) return "";
        const first = positions[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && first.name) return first.name;
        return "";
    };

    const computeDefaultDistrict = () => {
        if (!districts || districts.length === 0) return "";
        const first = districts[0];
        if (first && typeof first === "object" && first.name) return first.name;
        return "";
    };

    // initialize defaults when config becomes available
    useEffect(() => {
        const defaultPos = computeDefaultPosition();
        const defaultDist = computeDefaultDistrict();
        setFilters((f) => ({
            position: f.position || defaultPos,
            district: f.district || defaultDist,
        }));
        // only runs when positions/districts change
    }, [positions, districts]);

    // fetchCounts is the function used below; keep name consistent
    useEffect(() => {
        let mounted = true;

        async function fetchCounts() {
            setLoading(true);
            try {
                // 1) Count agents
                const usersSnap = await getDocs(collection(db, "users"));
                let agentCount = 0;
                usersSnap.docs.forEach((d) => {
                    if (d.data()?.role === "agent") agentCount++;
                });

                // 2) Incidents count
                const incSnap = await getDocs(collection(db, "incidents"));
                const incCount = incSnap.size;

                // 3) Candidates count
                const candSnap = await getDocs(collection(db, "candidates"));
                const candCount = candSnap.size;

                // 4) Total votes rows count
                const votesSnap = await getDocs(collection(db, "votes"));
                const voteCount = votesSnap.size;

                // 5) Chart aggregation for selected filters
                const selPos = filters.position || computeDefaultPosition();
                const selDist = filters.district || computeDefaultDistrict();

                let candList = [];
                if (selPos && selDist) {
                    try {
                        const candQ = query(
                            collection(db, "candidates"),
                            where("position", "==", selPos),
                            where("district", "==", selDist)
                        );
                        const candSnap2 = await getDocs(candQ);
                        candList = candSnap2.docs.map((d) => ({ id: d.id, name: d.data().name }));
                    } catch (e) {
                        // composite query might fail or return nothing; fall back to empty
                        candList = [];
                    }
                }

                const totals = {};
                if (candList.length > 0) {
                    candList.forEach((c) => (totals[c.id] = 0));
                    try {
                        const voteQ = query(
                            collection(db, "votes"),
                            where("position", "==", selPos),
                            where("district", "==", selDist)
                        );
                        const voteSnap2 = await getDocs(voteQ);
                        voteSnap2.docs.forEach((vd) => {
                            const v = vd.data();
                            const cid = v.candidateId;
                            const count = Number(v.votes || 0);
                            if (cid in totals) totals[cid] += count;
                        });
                    } catch (e) {
                        // ignore and leave totals zero
                    }
                }

                const chartArr = candList.map((c) => ({
                    name: c.name,
                    votes: totals[c.id] || 0,
                }));
                chartArr.sort((a, b) => b.votes - a.votes);

                if (mounted) {
                    setCounts({
                        totalAgents: agentCount,
                        totalVotes: voteCount,
                        totalIncidents: incCount,
                        totalCandidates: candCount,
                    });
                    setChartData(chartArr);
                    setLoading(false);
                }
            } catch (err) {
                console.error("AdminHome fetch error:", err);
                if (mounted) setLoading(false);
            }
        }

        fetchCounts();
        return () => {
            mounted = false;
        };
        // re-run when filters or config change
    }, [filters.position, filters.district, positions, districts]);

    const maxVotes = chartData.length > 0 ? Math.max(...chartData.map((d) => d.votes)) : 0;

    if (loading) return <p className="text-sm text-gray-600">Loading dashboard…</p>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>

            {/* Filters */}
            <div className="flex gap-2 items-end">
                <div>
                    <label className="text-sm block">Position</label>
                    <select
                        className="border p-2 rounded text-sm"
                        value={filters.position}
                        onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                    >
                        <option value="">Select Position</option>
                        {(positions || []).map((p) => {
                            const val = typeof p === "string" ? p : p.name || "";
                            const key = (p && p.id) || val;
                            return (
                                <option key={key} value={val}>
                                    {val}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div>
                    <label className="text-sm block">District</label>
                    <select
                        className="border p-2 rounded text-sm"
                        value={filters.district}
                        onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    >
                        <option value="">Select District</option>
                        {(districts || []).map((d) => (
                            <option key={d.id} value={d.name}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <span className="text-sm text-gray-500">Total Agents</span>
                    <div className="text-2xl font-semibold mt-2">{counts.totalAgents}</div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <span className="text-sm text-gray-500">Total Incidents</span>
                    <div className="text-2xl font-semibold mt-2">{counts.totalIncidents}</div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <span className="text-sm text-gray-500">Total Candidates</span>
                    <div className="text-2xl font-semibold mt-2">{counts.totalCandidates}</div>
                </div>
            </div>

            {/* Simple horizontal bar chart */}
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-3">
                    Results — {filters.position || "Position"} / {filters.district || "District"}
                </h3>

                {chartData.length === 0 ? (
                    <p className="text-sm text-gray-600">No results to show for selected filters.</p>
                ) : (
                    <div className="space-y-3">
                        {chartData.map((row) => {
                            const pct = maxVotes === 0 ? 0 : Math.round((row.votes / maxVotes) * 100);
                            return (
                                <div key={row.name} className="flex items-center gap-3">
                                    <div className="w-48 text-sm">{row.name}</div>
                                    <div className="flex-1 bg-gray-100 rounded overflow-hidden h-6">
                                        <div
                                            className="h-6 rounded"
                                            style={{
                                                width: `${pct}%`,
                                                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                                                minWidth: row.votes > 0 ? "4px" : "0px",
                                            }}
                                            title={`${row.votes} votes (${pct}%)`}
                                        />
                                    </div>
                                    <div className="w-28 text-right text-sm">{row.votes} votes ({pct}%)</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
