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
import { useAuth } from "../context/AuthContext"; // adjust import if your hook/context is named differently

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Overview() {
    const { currentUser, role } = useAuth(); // must provide uid and role
    const uid = currentUser?.uid;

    const positions = ["President", "Member of Parliament", "Woman MP", "Chairperson LCV"];
    const [position, setPosition] = useState("Parliament");

    const [districts] = useState(() => ["Lira"]);
    const [district, setDistrict] = useState("Lira");

    const [candidates, setCandidates] = useState([]);
    const [voteTotals, setVoteTotals] = useState({});
    const [incidents, setIncidents] = useState([]);

    const [loadingData, setLoadingData] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Load candidates & votes
    useEffect(() => {
        if (!currentUser) return;

        let isMounted = true;
        async function loadData() {
            setLoadingData(true);
            setErrorMsg("");

            try {
                // Load candidates
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

                // Init totals
                const totalsMap = {};
                candList.forEach((c) => {
                    totalsMap[c.id] = 0;
                });

                // Load votes — role-aware
                let voteQ;
                if (role === "admin" || role === "superadmin") {
                    voteQ = query(
                        collection(db, "votes"),
                        where("position", "==", position),
                        where("district", "==", district)
                    );
                } else if (role === "agent") {
                    // Only own votes
                    voteQ = query(
                        collection(db, "votes"),
                        where("position", "==", position),
                        where("district", "==", district),
                        where("agentId", "==", uid)
                    );
                } else {
                    // Unknown role
                    setErrorMsg("Unknown role. Limited data displayed.");
                    setLoadingData(false);
                    return;
                }

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
            } catch (err) {
                console.error("Error loading candidates/votes:", err);
                if (err.code === "permission-denied") {
                    setErrorMsg("You don't have permission to view this data.");
                } else {
                    setErrorMsg("Failed to load results. Please try again.");
                }
                setLoadingData(false);
            }
        }

        loadData();
        return () => {
            isMounted = false;
        };
    }, [currentUser, role, uid, position, district]);

    // Load incidents (rules allow read for any auth user)
    useEffect(() => {
        if (!currentUser) return;

        let isMounted = true;
        async function loadIncidents() {
            try {
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
            } catch (err) {
                console.error("Error loading incidents:", err);
                if (err.code === "permission-denied") {
                    setErrorMsg("You don't have permission to view incident reports.");
                }
            }
        }
        loadIncidents();
        return () => {
            isMounted = false;
        };
    }, [currentUser]);

    const chartData = useMemo(() => {
        const labels = candidates.map((c) => c.name);
        const dataValues = candidates.map((c) => voteTotals[c.id] || 0);
        const baseColors = [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
        ];
        const backgroundColors = labels.map((_, idx) => baseColors[idx % baseColors.length]);

        return {
            labels,
            datasets: [
                {
                    label: "Total Votes",
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    barThickness: 16,
                    maxBarThickness: 20,
                },
            ],
        };
    }, [candidates, voteTotals]);

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
                        const totalAll = Object.values(voteTotals).reduce((sum, v) => sum + v, 0);
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
            {errorMsg && (
                <div className="p-2 bg-yellow-100 text-yellow-800 rounded">{errorMsg}</div>
            )}

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

            {/* Incident Reports */}
            <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Incident Reports</h2>
                {incidents.length === 0 ? (
                    <p className="text-sm text-gray-600">No incidents reported.</p>
                ) : (
                    <div className="space-y-2">
                        {incidents.map((inc) => (
                            <div key={inc.id} className="text-sm text-gray-800 border-b pb-1">
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
