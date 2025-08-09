// src/pages/Votes.js
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useConfig } from "../context/ConfigContext";

export default function Votes() {
  // 1) Hooks must be at the top, unconditionally:
  const { districts, positions } = useConfig();

  // Entry fields
  const [accredited, setAccredited] = useState("");
  const [votesCast, setVotesCast] = useState("");
  const [spoiled, setSpoiled] = useState("");

  // Location & candidate selectors
  // Using the first config values if available, else empty string
  const [district, setDistrict] = useState("");
  const [position, setPosition] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");

  // Feedback
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  // 2) Load candidates when district/position change:
  useEffect(() => {
    if (!district || !position) return;
    (async () => {
      const q = query(
        collection(db, "candidates"),
        where("position", "==", position),
        where("district", "==", district)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCandidates(list);
      setSelectedCandidate(list[0]?.id || "");
    })();
  }, [district, position]);

  // 3) Initialize district & position once config loads:
  useEffect(() => {
    if (districts.length) {
      setDistrict(districts[0].name);
    }
  }, [districts]);
  useEffect(() => {
    if (positions.length) {
      setPosition(positions[0]);
    }
  }, [positions]);

  // 4) Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });
    const acc = parseInt(accredited, 10);
    const votes = parseInt(votesCast, 10);
    const spo = parseInt(spoiled, 10);
    if ([acc, votes, spo].some((n) => isNaN(n) || n < 0)) {
      return setFeedback({
        text: "All fields must be non-negative numbers",
        type: "error",
      });
    }
    try {
      await addDoc(collection(db, "votes"), {
        position,
        candidateId: selectedCandidate,
        district,
        accredited: acc,
        votesCast: votes,
        spoiled: spo,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setFeedback({
        text: "Submission saved & pending approval",
        type: "success",
      });
      setAccredited("");
      setVotesCast("");
      setSpoiled("");
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  // 5) Finally, render. Conditionally show loading if config not ready:
  if (!districts.length || !positions.length) {
    return <p className="p-4 text-gray-600">Loading configuration…</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Record Votes</h2>

      {feedback.text && (
        <div
          className={`p-2 rounded ${feedback.type === "success"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Accredited / Votes / Spoiled */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Accredited"
            value={accredited}
            onChange={(e) => setAccredited(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Votes Cast"
            value={votesCast}
            onChange={(e) => setVotesCast(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Spoiled"
            value={spoiled}
            onChange={(e) => setSpoiled(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* District & Position */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Dropdown */}
        <select
          value={selectedCandidate}
          onChange={(e) => setSelectedCandidate(e.target.value)}
          className="border p-2 rounded w-full"
          required
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Submit for Approval
        </button>
      </form>
    </div>
  );
}
