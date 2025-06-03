// src/pages/Incidents.js
import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// ── 1) Hardcoded admin‐unit hierarchy (same as Votes.js) ──
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

export default function Incidents() {
    // ── 2) Administrative dropdown state ──
    const districts = Object.keys(adminHierarchy); // ["Butaleja"]
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

    // ── 3) Incident form fields ──
    const [headline, setHeadline] = useState("");
    const [description, setDescription] = useState("");

    // ── 4) Feedback message ──
    const [feedback, setFeedback] = useState({ text: "", type: "" });

    // ── 5) Update subcounty/parish/village when district changes ──
    useEffect(() => {
        const firstSub = Object.keys(adminHierarchy[district])[0];
        setSubcounty(firstSub);

        const firstPar = Object.keys(adminHierarchy[district][firstSub])[0];
        setParish(firstPar);

        const firstVil = adminHierarchy[district][firstSub][firstPar][0];
        setVillage(firstVil);
    }, [district]);

    // ── 6) Update parish/village when subcounty changes ──
    useEffect(() => {
        const availableParishes = Object.keys(
            adminHierarchy[district][subcounty] || {}
        );
        const newParish = availableParishes[0] || "";
        setParish(newParish);

        const newVillages =
            adminHierarchy[district][subcounty]?.[newParish] || [];
        setVillage(newVillages[0] || "");
    }, [district, subcounty]);

    // ── 7) Update village when parish changes ──
    useEffect(() => {
        const villages =
            adminHierarchy[district][subcounty]?.[parish] || [];
        setVillage(villages[0] || "");
    }, [district, subcounty, parish]);

    // ── 8) Handle form submission ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ text: "", type: "" });

        if (!headline.trim()) {
            setFeedback({ text: "Headline is required.", type: "error" });
            return;
        }

        try {
            await addDoc(collection(db, "incidents"), {
                headline: headline.trim(),
                description: description.trim(),
                district,
                subcounty,
                parish,
                village,
                createdAt: serverTimestamp(),
            });
            setFeedback({ text: "Incident reported successfully!", type: "success" });
            // Reset form fields
            setHeadline("");
            setDescription("");
            // Keep dropdowns at current selection
        } catch (err) {
            console.error("Error reporting incident:", err);
            setFeedback({
                text: "Failed to report incident. Try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-semibold mb-4">Report an Incident</h1>

            {feedback.text && (
                <div
                    className={`mb-4 p-2 rounded text-sm ${feedback.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                >
                    {feedback.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
                {/* Headline */}
                <div className="flex flex-col">
                    <label htmlFor="headline" className="text-sm font-medium mb-1">
                        Headline
                    </label>
                    <input
                        id="headline"
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Brief summary of incident"
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col">
                    <label htmlFor="description" className="text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Detailed description (optional)"
                    />
                </div>

                {/* Administrative Units (two-column on md) */}
                <div className="md:flex md:space-x-2">
                    {/* District */}
                    <div className="flex-1 flex flex-col mb-2 md:mb-0">
                        <label htmlFor="district" className="text-sm font-medium mb-1">
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

                    {/* Subcounty */}
                    <div className="flex-1 flex flex-col">
                        <label htmlFor="subcounty" className="text-sm font-medium mb-1">
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
                </div>

                <div className="md:flex md:space-x-2">
                    {/* Parish */}
                    <div className="flex-1 flex flex-col mb-2 md:mb-0">
                        <label htmlFor="parish" className="text-sm font-medium mb-1">
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

                    {/* Village */}
                    <div className="flex-1 flex flex-col">
                        <label htmlFor="village" className="text-sm font-medium mb-1">
                            Village (Location)
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

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700 transition"
                >
                    Submit Incident
                </button>
            </form>
        </div>
    );
}
