// src/pages/VoteEntry.js
import { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function VoteEntry() {
    const { currentUser } = useAuth();

    // Form state
    const [stationId, setStationId] = useState("");
    const [electionType, setElectionType] = useState("presidential");
    const [accredited, setAccredited] = useState(0);
    const [votesCast, setVotesCast] = useState(0);
    const [spoiled, setSpoiled] = useState(0);

    // Network status
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    // Recent entries for the selected station
    const [entries, setEntries] = useState([]);
    useEffect(() => {
        if (!currentUser || !stationId) {
            setEntries([]);
            return;
        }
        const votesRef = collection(
            db,
            "districts",
            "butaleja",
            "stations",
            stationId,
            "votes"
        );
        const q = query(votesRef, orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEntries(docs);
        });
        return unsub;
    }, [currentUser, stationId]);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stationId) {
            return alert("Please select a polling station first.");
        }
        try {
            await addDoc(
                collection(
                    db,
                    "districts",
                    "butaleja",
                    "stations",
                    stationId,
                    "votes"
                ),
                {
                    agentId: currentUser.uid,
                    electionType,
                    accredited: Number(accredited),
                    votesCast: Number(votesCast),
                    spoiled: Number(spoiled),
                    timestamp: serverTimestamp(),
                }
            );
            setAccredited(0);
            setVotesCast(0);
            setSpoiled(0);
        } catch (err) {
            console.error("Error saving vote entry:", err);
            alert("Failed to save. It will retry when you're back online.");
        }
    };

    // Hard-coded station list (you can later fetch from Firestore)
    const stationOptions = ["Station_A", "Station_B", "Station_C"];

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Vote Entry</h1>
                <span
                    className={
                        "px-2 py-1 text-sm rounded " +
                        (online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
                    }
                >
                    {online ? "Online" : "Offline"}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <select
                    required
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Select Station</option>
                    {stationOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={electionType}
                    onChange={(e) => setElectionType(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="presidential">Presidential</option>
                    <option value="parliamentary">Parliamentary</option>
                    <option value="lcv">Chairperson LCV</option>
                </select>

                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="number" min="0"
                        value={accredited}
                        onChange={(e) => setAccredited(e.target.value)}
                        placeholder="Accredited"
                        className="p-2 border rounded"
                    />
                    <input
                        type="number" min="0"
                        value={votesCast}
                        onChange={(e) => setVotesCast(e.target.value)}
                        placeholder="Votes Cast"
                        className="p-2 border rounded"
                    />
                    <input
                        type="number" min="0"
                        value={spoiled}
                        onChange={(e) => setSpoiled(e.target.value)}
                        placeholder="Spoiled"
                        className="p-2 border rounded"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded"
                >
                    Submit Entry
                </button>
            </form>

            <div className="mt-6">
                <h2 className="font-semibold mb-2">Recent Entries</h2>
                <ul className="space-y-1 text-sm">
                    {entries.length > 0 ? (
                        entries.slice(0, 10).map((e) => (
                            <li key={e.id} className="border-b pb-1">
                                [{e.electionType}] Accredited: {e.accredited}, Cast: {e.votesCast}, Spoiled: {e.spoiled}
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500">Select a station to see your entries.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
