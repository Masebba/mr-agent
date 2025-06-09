// src/pages/Overview.js
import { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function Overview() {
    // 1) Position & District selectors
    const positions = ["President", "Parliament", "Chairperson LCV"];
    const [position, setPosition] = useState("Parliament");

    // District list must match adminHierarchy in Votes.js
    const [districts] = useState(() => ["Butaleja"]);
    const [district, setDistrict] = useState("Butaleja");

    // 2) Firestore-driven state
    const [candidates, setCandidates] = useState([]); // { id, name }
    const [voteTotals, setVoteTotals] = useState({}); // { [candidateId]: totalVotes }
    const [incidents, setIncidents] = useState([]); // { id, headline, description }

    const [loadingData, setLoadingData] = useState(true);

    // 3) Fetch candidates + aggregated votes when position or district changes
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setLoadingData(true);

            // 3a) Load candidates for this position & district
            const candQ = query(
                collection(db, "candidates"),
                where("position", "==", position),
                where("district", "==", district)
            );
            const candSnap = await getDocs(candQ);
            const candList = candSnap.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));

            // 3b) Initialize totals map to zero
            const totalsMap = {};
            candList.forEach((c) => {
                totalsMap[c.id] = 0;
            });

            // 3c) Load votes documents for position & district
            const voteQ = query(
                collection(db, "votes"),
                where("position", "==", position),
                where("district", "==", district)
            );
            const voteSnap = await getDocs(voteQ);
            voteSnap.docs.forEach((vdoc) => {
                const data = vdoc.data();
                const cid = data.candidateId;
                const count = data.votes || 0;
                if (cid in totalsMap) {
                    totalsMap[cid] += count;
                }
            });

            if (isMounted) {
                setCandidates(candList);
                setVoteTotals(totalsMap);
                setLoadingData(false);
            }
        }

        loadData();
        return () => {
            isMounted = false;
        };
    }, [position, district]);

    // 4) Fetch incidents once
    useEffect(() => {
        let isMounted = true;
        async function loadIncidents() {
            const incQ = query(collection(db, "incidents"));
            const incSnap = await getDocs(incQ);
            const list = incSnap.docs.map((doc) => ({
                id: doc.id,
                headline: doc.data().headline,
                description: doc.data().description || "",
            }));
            if (isMounted) {
                setIncidents(list);
            }
        }
        loadIncidents();
        return () => {
            isMounted = false;
        };
    }, []);

    // 5) Prepare data for Bar chart via useMemo
    const chartData = useMemo(() => {
        // Build arrays of labels (candidate names) and data (vote counts)
        const labels = candidates.map((c) => c.name);
        const dataValues = candidates.map((c) => voteTotals[c.id] || 0);

        // Generate a distinct color for each candidate
        const baseColors = [
            "#3b82f6", // blue-500
            "#ef4444", // red-500
            "#10b981", // green-500
            "#f59e0b", // yellow-500
            "#8b5cf6", // purple-500
            "#ec4899", // pink-500
        ];
        const backgroundColors = labels.map((_, idx) => {
            return baseColors[idx % baseColors.length];
        });

        return {
            labels,
            datasets: [
                {
                    label: "Total Votes",
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    barThickness: 16,       // reduce bar thickness
                    maxBarThickness: 20,
                },
            ],
        };
    }, [candidates, voteTotals]);

    // 6) Chart.js options for horizontal bar (indexAxis: "y")
    const chartOptions = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.x;
                        const totalAll = Object.values(voteTotals).reduce(
                            (sum, v) => sum + v,
                            0
                        );
                        const pct = totalAll > 0 ? ((val / totalAll) * 100).toFixed(1) : "0";
                        return `${val} votes (${pct}%)`;
                    },
                },
            },
            title: {
                display: true,
                text: `Results in ${district} for ${position}`,
                font: { size: 18 },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                title: { display: true, text: "Number of Votes" },
            },
            y: { title: { display: false } },
        },
    };

    return (
        <div className="p-6 space-y-6">
            {/* Selectors */}
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex-1 flex flex-col">
                    <label htmlFor="position" className="text-sm font-medium mb-1">
                        Position
                    </label>
                    <select
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="p-2 border rounded text-sm"
                    >
                        {positions.map((pos) => (
                            <option key={pos} value={pos}>
                                {pos}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 flex flex-col">
                    <label htmlFor="district" className="text-sm font-medium mb-1">
                        District
                    </label>
                    <select
                        id="district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="p-2 border rounded text-sm"
                    >
                        {districts.map((dist) => (
                            <option key={dist} value={dist}>
                                {dist}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="bg-white rounded shadow p-4 h-80">
                {loadingData ? (
                    <p className="text-center text-sm text-gray-600">Loading results…</p>
                ) : candidates.length === 0 ? (
                    <p className="text-center text-sm text-gray-600">
                        No candidates found for this position/district.
                    </p>
                ) : (
                    <Bar data={chartData} options={chartOptions} />
                )}
            </div>

            {/* Incident Reports List */}
            <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Incident Reports</h2>
                {incidents.length === 0 ? (
                    <p className="text-sm text-gray-600">No incidents reported.</p>
                ) : (
                    <div className="space-y-2">
                        {incidents.map((inc) => (
                            <div
                                key={inc.id}
                                className="text-sm text-gray-800 border-b pb-1"
                            >
                                <strong>{inc.headline}</strong>:{" "}
                                {inc.description.length > 100
                                    ? `${inc.description.slice(0, 110)}…`
                                    : inc.description}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
