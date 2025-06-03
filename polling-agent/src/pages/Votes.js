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
import { db } from "../firebase";

// ── 1) Keep adminHierarchy outside the component ──
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
const positions = ["President", "Parliament", "Chairperson LCV"];

export default function Votes() {
    // ── 2) State for “Add Candidate” form ──
    const [newName, setNewName] = useState("");
    const [newPosition, setNewPosition] = useState("Parliament");
    const [newDistrict, setNewDistrict] = useState("Butaleja");
    const [addCandMsg, setAddCandMsg] = useState({ text: "", type: "" });

    // ── 3) State for “Record Votes” form ──
    const [position, setPosition] = useState("Parliament");
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

    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState("");

    const [voteCount, setVoteCount] = useState("");
    const [feedback, setFeedback] = useState({ text: "", type: "" });

    const districts = Object.keys(adminHierarchy);

    // ── 4) Fetch candidates when `position` OR `district` changes ──
    useEffect(() => {
        async function loadCandidates() {
            try {
                // Composite query: position == position AND district == district
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
                setSelectedCandidate(list.length > 0 ? list[0].id : "");
            } catch (err) {
                console.error("Error loading candidates:", err);
                setCandidates([]);
                setSelectedCandidate("");
            }
        }
        loadCandidates();
    }, [position, district]);

    // ── 5) When `district` changes → reset subcounty, parish, village ──
    useEffect(() => {
        const firstSub = Object.keys(adminHierarchy[district])[0];
        setSubcounty(firstSub);
        const firstPar = Object.keys(adminHierarchy[district][firstSub])[0];
        setParish(firstPar);
        const firstVil = adminHierarchy[district][firstSub][firstPar][0];
        setVillage(firstVil);
    }, [district]);

    // ── 6) When `subcounty` or `district` changes → reset parish, village ──
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

    // ── 7) When `parish` changes → reset village ──
    useEffect(() => {
        const villages =
            adminHierarchy[district][subcounty]?.[parish] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty, parish]);

    // ── 8) Handle saving a new vote ──
    const handleSaveVote = async (e) => {
        e.preventDefault();
        setFeedback({ text: "", type: "" });

        if (!selectedCandidate || voteCount === "") {
            setFeedback({
                text: "Please select a candidate and enter votes.",
                type: "error",
            });
            return;
        }

        const votesNumeric = parseInt(voteCount, 10);
        if (isNaN(votesNumeric) || votesNumeric < 0) {
            setFeedback({
                text: "Votes must be a non-negative number.",
                type: "error",
            });
            return;
        }

        try {
            await addDoc(collection(db, "votes"), {
                position,
                candidateId: selectedCandidate,
                district,
                subcounty,
                parish,
                village,
                votes: votesNumeric,
                createdAt: serverTimestamp(),
            });
            setFeedback({ text: "Vote saved successfully!", type: "success" });
            setVoteCount("");
        } catch (err) {
            console.error("Error saving vote:", err);
            setFeedback({
                text: "Failed to save vote. Try again.",
                type: "error",
            });
        }
    };

    // ── 9) Handle adding a new candidate ──
    const handleAddCandidate = async (e) => {
        e.preventDefault();
        setAddCandMsg({ text: "", type: "" });

        if (!newName.trim()) {
            setAddCandMsg({ text: "Candidate name is required.", type: "error" });
            return;
        }

        try {
            await addDoc(collection(db, "candidates"), {
                name: newName.trim(),
                position: newPosition,
                district: newDistrict,
                createdAt: serverTimestamp(),
            });
            setAddCandMsg({
                text: `Added ${newName} (${newPosition}, ${newDistrict}).`,
                type: "success",
            });
            setNewName("");
            setNewPosition("Parliament");
            setNewDistrict("Butaleja");
            // If the new candidate matches current filters, reload list:
            if (newPosition === position && newDistrict === district) {
                // reload candidates immediately
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
                setSelectedCandidate(list.length > 0 ? list[0].id : "");
            }
        } catch (err) {
            console.error("Error adding candidate:", err);
            setAddCandMsg({
                text: "Failed to add candidate. Try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* ── Add Candidate Section (compact) ── */}
            <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
                <h2 className="text-xl font-semibold">Add Candidate</h2>
                {addCandMsg.text && (
                    <div
                        className={`text-sm p-1 rounded ${addCandMsg.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {addCandMsg.text}
                    </div>
                )}
                <form onSubmit={handleAddCandidate} className="space-y-2">
                    <div className="flex flex-col">
                        <label htmlFor="newName" className="text-sm mb-1">
                            Name
                        </label>
                        <input
                            id="newName"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Candidate’s full name"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="newPosition" className="text-sm mb-1">
                            Position
                        </label>
                        <select
                            id="newPosition"
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                        >
                            {positions.map((pos) => (
                                <option key={pos} value={pos}>
                                    {pos}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="newDistrict" className="text-sm mb-1">
                            District
                        </label>
                        <select
                            id="newDistrict"
                            value={newDistrict}
                            onChange={(e) => setNewDistrict(e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                        >
                            {districts.map((dist) => (
                                <option key={dist} value={dist}>
                                    {dist}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="mt-1 w-full bg-blue-600 text-white p-1 rounded text-sm hover:bg-blue-700 transition"
                    >
                        Add Candidate
                    </button>
                </form>
            </div>

            {/* ── Record Votes Section ── */}
            <div className="bg-white p-4 rounded shadow space-y-2">
                <h2 className="text-xl font-semibold mb-2">Record Votes</h2>

                {feedback.text && (
                    <div
                        className={`text-sm p-1 rounded ${feedback.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            } mb-2`}
                    >
                        {feedback.text}
                    </div>
                )}

                <form onSubmit={handleSaveVote} className="space-y-2">
                    {/* Position & District (two‐column on md+) */}
                    <div className="md:flex md:space-x-2">
                        <div className="flex-1 flex flex-col mb-2 md:mb-0">
                            <label htmlFor="position" className="text-sm mb-1">
                                Position
                            </label>
                            <select
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {positions.map((pos) => (
                                    <option key={pos} value={pos}>
                                        {pos}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label htmlFor="district" className="text-sm mb-1">
                                District
                            </label>
                            <select
                                id="district"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {districts.map((dist) => (
                                    <option key={dist} value={dist}>
                                        {dist}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Candidate & Subcounty (two‐column on md+) */}
                    <div className="md:flex md:space-x-2">
                        <div className="flex-1 flex flex-col mb-2 md:mb-0">
                            <label htmlFor="candidate" className="text-sm mb-1">
                                Candidate
                            </label>
                            <select
                                id="candidate"
                                value={selectedCandidate}
                                onChange={(e) => setSelectedCandidate(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {candidates.length === 0 ? (
                                    <option value="">No candidates</option>
                                ) : (
                                    candidates.map((cand) => (
                                        <option key={cand.id} value={cand.id}>
                                            {cand.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label htmlFor="subcounty" className="text-sm mb-1">
                                Subcounty
                            </label>
                            <select
                                id="subcounty"
                                value={subcounty}
                                onChange={(e) => setSubcounty(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {Object.keys(adminHierarchy[district]).map((sc) => (
                                    <option key={sc} value={sc}>
                                        {sc}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Parish & Village (two‐column on md+) */}
                    <div className="md:flex md:space-x-2">
                        <div className="flex-1 flex flex-col mb-2 md:mb-0">
                            <label htmlFor="parish" className="text-sm mb-1">
                                Parish
                            </label>
                            <select
                                id="parish"
                                value={parish}
                                onChange={(e) => setParish(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {Object.keys(adminHierarchy[district][subcounty]).map((pr) => (
                                    <option key={pr} value={pr}>
                                        {pr}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label htmlFor="village" className="text-sm mb-1">
                                Village (Polling Station)
                            </label>
                            <select
                                id="village"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                {adminHierarchy[district][subcounty][parish].map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Number of Votes */}
                    <div className="flex flex-col">
                        <label htmlFor="votes" className="text-sm mb-1">
                            Number of Votes
                        </label>
                        <input
                            id="votes"
                            type="number"
                            min="0"
                            value={voteCount}
                            onChange={(e) => setVoteCount(e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="e.g., 125"
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-1 rounded text-sm hover:bg-blue-700 transition"
                    >
                        Save Vote
                    </button>
                </form>
            </div>
        </div>
    );
}
