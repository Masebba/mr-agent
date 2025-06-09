// src/pages/Votes.js
import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import { db, app } from "../firebase";

// ── Keep adminHierarchy outside the component ──
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

// ── Position options ──
const positions = [
    "President",
    "Member of Parliament",
    "Woman Member of Parliament",
    "Chairperson LCV",
];

export default function Votes() {
    // ── Hierarchy states ──
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

    const districts = Object.keys(adminHierarchy);

    // ── Candidate list + vote inputs ──
    const [candidates, setCandidates] = useState([]);
    // Map of candidateId → voteCount (string)
    const [candidatesVotes, setCandidatesVotes] = useState({});

    // ── DR Form photo states ──
    const [drFile, setDrFile] = useState(null);
    const [drPreview, setDrPreview] = useState(null);

    // ── Station results ──
    const [stationResults, setStationResults] = useState([]);

    // ── Feedback banner ──
    const [feedback, setFeedback] = useState({ text: "", type: "" });

    const storage = getStorage(app);

    // ── 1) Fetch candidates whenever `position` or `district` changes ──
    useEffect(() => {
        async function loadCandidates() {
            try {
                const q = query(
                    collection(db, "candidates"),
                    where("position", "==", position),
                    where("district", "==", district)
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name,
                }));
                setCandidates(list);

                // Initialize vote input state for each candidate
                const initMap = {};
                list.forEach((cand) => {
                    initMap[cand.id] = "";
                });
                setCandidatesVotes(initMap);
            } catch (err) {
                console.error("Error loading candidates:", err);
                setCandidates([]);
                setCandidatesVotes({});
            }
        }
        loadCandidates();
    }, [position, district]);

    // ── 2) When `district` changes → reset `subcounty`, `parish`, `village` ──
    useEffect(() => {
        const firstSub = Object.keys(adminHierarchy[district])[0];
        setSubcounty(firstSub);
        const firstPar = Object.keys(adminHierarchy[district][firstSub])[0];
        setParish(firstPar);
        const firstVil = adminHierarchy[district][firstSub][firstPar][0];
        setVillage(firstVil);
    }, [district]);

    // ── 3) When `subcounty` or `district` changes → reset `parish` & `village` ──
    useEffect(() => {
        const availableParishes = Object.keys(
            adminHierarchy[district][subcounty] || {}
        );
        const newPar = availableParishes[0] || "";
        setParish(newPar);
        const villages =
            adminHierarchy[district][subcounty]?.[newPar] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty]);

    // ── 4) When `parish` changes → reset `village` ──
    useEffect(() => {
        const villages =
            adminHierarchy[district][subcounty]?.[parish] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty, parish]);

    // ── 5) Handle DR Form file selection ──
    const handleDrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDrFile(file);
            const reader = new FileReader();
            reader.onload = () => setDrPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setDrFile(null);
            setDrPreview(null);
        }
    };

    // ── 6) Handle vote input change for a specific candidate ──
    const handleVoteChange = (candId, value) => {
        setCandidatesVotes((prev) => ({
            ...prev,
            [candId]: value,
        }));
    };

    // ── 7) Aggregate station results when hierarchy or candidates change ──
    useEffect(() => {
        async function loadStationResults() {
            try {
                if (candidates.length === 0) {
                    setStationResults([]);
                    return;
                }
                const votesRef = collection(db, "votes");
                const q = query(
                    votesRef,
                    where("position", "==", position),
                    where("district", "==", district),
                    where("subcounty", "==", subcounty),
                    where("parish", "==", parish),
                    where("village", "==", village)
                );
                const snap = await getDocs(q);
                // Sum votes per candidateId
                const sums = {};
                snap.docs.forEach((doc) => {
                    const data = doc.data();
                    const cid = data.candidateId;
                    const count = data.votes || 0;
                    sums[cid] = (sums[cid] || 0) + count;
                });
                // Build results array with name + total
                const results = candidates.map((cand) => ({
                    id: cand.id,
                    name: cand.name,
                    totalVotes: sums[cand.id] || 0,
                }));
                setStationResults(results);
            } catch (err) {
                console.error("Error loading station results:", err);
                setStationResults([]);
            }
        }
        loadStationResults();
    }, [position, district, subcounty, parish, village, candidates]);

    // ── 8) Handle form submission (all candidates + DR Form) ──
    const handleSaveVotes = async (e) => {
        e.preventDefault();
        setFeedback({ text: "", type: "" });

        // 8a) Validate at least one candidate has a non‐empty, non‐negative vote
        const entries = Object.entries(candidatesVotes);
        const toSave = entries
            .map(([candId, str]) => {
                const num = parseInt(str, 10);
                if (!isNaN(num) && num >= 0) {
                    return { candId, votes: num };
                }
                return null;
            })
            .filter((x) => x !== null);

        if (toSave.length === 0) {
            setFeedback({
                text: "Enter a non-negative vote count for at least one candidate.",
                type: "error",
            });
            return;
        }

        // 8b) If a DR Form was selected, upload and get its URL
        let drUrl = "";
        if (drFile) {
            try {
                const filePath = `drForms/${Date.now()}_${drFile.name}`;
                const drRef = storageRef(storage, filePath);
                await uploadBytes(drRef, drFile);
                drUrl = await getDownloadURL(drRef);
            } catch (err) {
                console.error("Error uploading DR Form photo:", err);
                setFeedback({
                    text: "Failed to upload Declaration Form photo. Try again.",
                    type: "error",
                });
                return;
            }
        }

        // 8c) Save one Firestore document per candidate‐vote pair
        try {
            const batchPromises = toSave.map(({ candId, votes }) =>
                addDoc(collection(db, "votes"), {
                    position,
                    candidateId: candId,
                    district,
                    subcounty,
                    parish,
                    village,
                    votes,
                    drFormUrl: drUrl,
                    createdAt: serverTimestamp(),
                })
            );
            await Promise.all(batchPromises);

            setFeedback({ text: "Votes saved successfully!", type: "success" });

            // Clear inputs
            const clearedMap = {};
            candidates.forEach((cand) => {
                clearedMap[cand.id] = "";
            });
            setCandidatesVotes(clearedMap);
            setDrFile(null);
            setDrPreview(null);

            // Reload station results
            const updatedSums = {};
            toSave.forEach(({ candId, votes }) => {
                updatedSums[candId] =
                    (updatedSums[candId] || stationResults.find(r => r.id === candId)?.totalVotes || 0) +
                    votes;
            });
            setStationResults((prev) =>
                prev.map((r) => ({
                    ...r,
                    totalVotes:
                        (updatedSums[r.id] !== undefined
                            ? updatedSums[r.id]
                            : r.totalVotes),
                }))
            );
        } catch (err) {
            console.error("Error saving votes:", err);
            setFeedback({
                text: "Failed to save votes. Try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            {/* ── Record Votes Section ── */}
            <div className="bg-white p-4 rounded shadow space-y-4">
                <h2 className="text-xl font-semibold mb-2">Record Votes</h2>

                {/* Feedback banner */}
                {feedback.text && (
                    <div
                        className={`text-sm p-2 rounded ${feedback.type === "success"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {feedback.text}
                    </div>
                )}

                <form onSubmit={handleSaveVotes} className="space-y-6">
                    {/* ── Hierarchy dropdowns ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="position" className="text-sm mb-1">
                                Position
                            </label>
                            <select
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {positions.map((pos) => (
                                    <option key={pos} value={pos}>
                                        {pos}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="district" className="text-sm mb-1">
                                District
                            </label>
                            <select
                                id="district"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {districts.map((dist) => (
                                    <option key={dist} value={dist}>
                                        {dist}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="subcounty" className="text-sm mb-1">
                                Subcounty
                            </label>
                            <select
                                id="subcounty"
                                value={subcounty}
                                onChange={(e) => setSubcounty(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {Object.keys(adminHierarchy[district]).map((sc) => (
                                    <option key={sc} value={sc}>
                                        {sc}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="parish" className="text-sm mb-1">
                                Parish
                            </label>
                            <select
                                id="parish"
                                value={parish}
                                onChange={(e) => setParish(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {Object.keys(adminHierarchy[district][subcounty]).map((pr) => (
                                    <option key={pr} value={pr}>
                                        {pr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="village" className="text-sm mb-1">
                                Village (Polling Station)
                            </label>
                            <select
                                id="village"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {adminHierarchy[district][subcounty][parish].map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Candidate‐Vote table ── */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="p-2 text-left border">Candidate</th>
                                    <th className="p-2 text-left border">Enter Votes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="p-2 text-center text-purple-500 border"
                                        >
                                            No candidates found for this Position/District
                                        </td>
                                    </tr>
                                ) : (
                                    candidates.map((cand) => (
                                        <tr key={cand.id} className="border-b">
                                            <td className="p-2 border">{cand.name}</td>
                                            <td className="p-2 border">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={candidatesVotes[cand.id]}
                                                    onChange={(e) =>
                                                        handleVoteChange(cand.id, e.target.value)
                                                    }
                                                    className="w-24 p-1 border rounded text-sm"
                                                    placeholder="0"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── DR Form Photo (once) ── */}
                    <div className="flex flex-col">
                        <label htmlFor="drForm" className="text-sm mb-1">
                            Declaration Form (DR Form) Photo
                        </label>
                        <input
                            id="drForm"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleDrChange}
                            className="w-full text-sm"
                        />
                        {drPreview && (
                            <img
                                src={drPreview}
                                alt="DR Form Preview"
                                className="mt-2 h-32 object-contain rounded border"
                            />
                        )}
                    </div>

                    {/* ── Save All Votes ── */}
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-950 text-white p-2 rounded text-sm hover:bg-purple-950 transition"
                    >
                        Save Votes
                    </button>
                </form>
            </div>

            {/* ── Polling Station Totals ── */}
            <div className="bg-white p-4 rounded shadow space-y-2">
                <h3 className="text-lg font-semibold">
                    Results for {village}, {parish}, {subcounty}, {district} ({position})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-purple-100">
                            <tr>
                                <th className="p-2 text-left border">Candidate</th>
                                <th className="p-2 text-left border">Total Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stationResults.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={2}
                                        className="p-2 text-center text-purple-500 border"
                                    >
                                        No votes recorded yet for this station.
                                    </td>
                                </tr>
                            ) : (
                                stationResults.map((res) => (
                                    <tr key={res.id} className="border-b">
                                        <td className="p-2 border">{res.name}</td>
                                        <td className="p-2 border">{res.totalVotes}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
