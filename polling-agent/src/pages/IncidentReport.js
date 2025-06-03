import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function IncidentReport() {
    const { currentUser } = useAuth();

    const [stationId, setStationId] = useState("");
    const [incidentType, setIncidentType] = useState("security");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [gpsStatus, setGpsStatus] = useState("idle");

    // Hard-coded station list (later: fetch from Firestore)
    const stationOptions = ["Station_A", "Station_B", "Station_C"];

    // Try to get GPS on component mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus("unsupported");
            return;
        }
        setGpsStatus("pending");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
                setGpsStatus("success");
            },
            (err) => {
                console.warn("Geolocation error:", err);
                setGpsStatus("error");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stationId) return alert("Select a station.");
        if (!description.trim()) return alert("Add a description.");

        try {
            await addDoc(
                collection(db, "districts", "butaleja", "stations", stationId, "incidents"),
                {
                    agentId: currentUser.uid,
                    type: incidentType,
                    description,
                    location,
                    timestamp: serverTimestamp(),
                }
            );
            alert("Incident reported!");
            setDescription("");
            setIncidentType("security");
        } catch (err) {
            console.error("Incident save error:", err);
            alert("Failed to report. Will retry when online.");
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
            <h1 className="text-xl font-bold mb-4">Report Incident</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Station */}
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

                {/* Incident Type */}
                <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="security">Security</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                </select>

                {/* Description */}
                <textarea
                    required
                    rows="4"
                    placeholder="Describe the incident..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded resize-none"
                />

                {/* GPS Status */}
                <p className="text-sm text-gray-600">
                    GPS status:{" "}
                    {gpsStatus === "pending" && "Acquiring..."}
                    {gpsStatus === "success" && `OK (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`}
                    {gpsStatus === "error" && "Error getting location"}
                    {gpsStatus === "unsupported" && "Geolocation not supported"}
                </p>

                <button
                    type="submit"
                    className="w-full p-2 bg-red-600 text-white rounded"
                >
                    Submit Incident
                </button>
            </form>
        </div>
    );
}
