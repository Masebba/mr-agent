// src/pages/admin/AdminHome.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LabelList,
} from "recharts";

// Administrative hierarchy shared across pages
const adminHierarchy = {
    Butaleja: {
        "Bukooli North": {
            "Bwikhonge Parish": ["Bukolu Village", "Bukuchony Village"],
            "Buseta Parish": ["Buseta Central", "Buseta East"],
        },
        Budaka: {
            "Gweri Parish": ["Gweri Central", "Gweri North"],
            "Koglansu Parish": ["Koglansu Main", "Koglansu East"],
        },
    },
};
const positions = [
    "President",
    "Member of Parliament",
    "Woman Member of Parliament",
    "Chairperson LCV",
];

export default function AdminHome() {
    const [counts, setCounts] = useState({
        totalAgents: 0,
        totalIncidents: 0,
        totalCandidates: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filters for chart
    const [position, setPosition] = useState("Member of Parliament");
    const [district, setDistrict] = useState("Butaleja");
    const [subcounty, setSubcounty] = useState(
        Object.keys(adminHierarchy["Butaleja"])[0]
    );
    const [parish, setParish] = useState(
        Object.keys(adminHierarchy["Butaleja"][subcounty])[0]
    );
    const [village, setVillage] = useState(
        adminHierarchy["Butaleja"][subcounty][parish][0]
    );
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);

    // Reset dependent filters
    useEffect(() => {
        const firstSub = Object.keys(adminHierarchy[district])[0];
        setSubcounty(firstSub);
        const firstPar = Object.keys(adminHierarchy[district][firstSub])[0];
        setParish(firstPar);
        const firstVil = adminHierarchy[district][firstSub][firstPar][0];
        setVillage(firstVil);
    }, [district]);

    useEffect(() => {
        const parishes = Object.keys(adminHierarchy[district][subcounty] || {});
        const newPar = parishes[0] || "";
        setParish(newPar);
        const villages = adminHierarchy[district][subcounty]?.[newPar] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty]);

    useEffect(() => {
        const villages = adminHierarchy[district][subcounty]?.[parish] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty, parish]);

    // Fetch basic counts
    useEffect(() => {
        async function fetchCounts() {
            setLoading(true);
            // agents
            const usersSnap = await getDocs(collection(db, "users"));
            const agentCount = usersSnap.docs.filter((d) => d.data().role === "agent").length;
            // incidents
            const incSnap = await getDocs(collection(db, "incidents"));
            const incCount = incSnap.size;
            // candidates
            const candSnap = await getDocs(collection(db, "candidates"));
            const candCount = candSnap.size;

            setCounts({ totalAgents: agentCount, totalIncidents: incCount, totalCandidates: candCount });
            setLoading(false);
        }
        fetchCounts();
    }, []);

    // Fetch chart data whenever filters change
    useEffect(() => {
        let active = true;
        async function loadChart() {
            setChartLoading(true);
            // get candidates for chosen filters
            const candQ = query(
                collection(db, "candidates"),
                where("position", "==", position),
                where("district", "==", district)
            );
            const candSnap = await getDocs(candQ);
            const candList = candSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));

            // init totals
            const totals = {};
            candList.forEach((c) => (totals[c.id] = 0));

            // get votes matching full hierarchy
            const voteQ = query(
                collection(db, "votes"),
                where("position", "==", position),
                where("district", "==", district),
                where("subcounty", "==", subcounty),
                where("parish", "==", parish),
                where("village", "==", village)
            );
            const voteSnap = await getDocs(voteQ);
            let totalAll = 0;
            voteSnap.docs.forEach((v) => {
                const d = v.data();
                if (d.candidateId in totals) {
                    totals[d.candidateId] += d.votes || 0;
                    totalAll += d.votes || 0;
                }
            });

            // build chart array
            const data = candList.map((c) => ({
                name: c.name,
                votes: totals[c.id] || 0,
                percentage: totalAll > 0 ? ((totals[c.id] / totalAll) * 100).toFixed(1) : 0,
            }));

            if (active) {
                setChartData(data);
                setChartLoading(false);
            }
        }
        loadChart();
        return () => { active = false; };
    }, [position, district, subcounty, parish, village]);

    if (loading) return <p className="text-sm text-gray-600">Loading dashboard…</p>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-white p-2 rounded shadow text-xs">
                <select value={position} onChange={(e) => setPosition(e.target.value)} className="p-1 border rounded">
                    {positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                </select>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="p-1 border rounded">
                    {Object.keys(adminHierarchy).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={subcounty} onChange={(e) => setSubcounty(e.target.value)} className="p-1 border rounded">
                    {Object.keys(adminHierarchy[district]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={parish} onChange={(e) => setParish(e.target.value)} className="p-1 border rounded">
                    {Object.keys(adminHierarchy[district][subcounty]).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={village} onChange={(e) => setVillage(e.target.value)} className="p-1 border rounded">
                    {adminHierarchy[district][subcounty][parish].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <div /> {/* placeholder */}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow flex flex-col">
                    <span className="text-sm text-gray-500">Total Agents</span>
                    <span className="text-2xl font-semibold mt-2">{counts.totalAgents}</span>
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

            {/* Bar Chart */}
            <div className="bg-white p-4 rounded shadow text-xs">
                {chartLoading ? (
                    <p className="text-sm text-gray-600">Loading chart…</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value, name) => [value, name === 'votes' ? 'Votes' : '%']} />
                            <Bar dataKey="votes" fill="#3182CE">
                                <LabelList dataKey="votes" position="top" style={{ fontSize: 12 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}