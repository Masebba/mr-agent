// src/pages/admin/ManageCandidates.js
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

// Position options
const positions = [
  "President",
  "Member of Parliament",
  "Woman Member of Parliament",
  "Chairperson LCV",
];
// District options
const districts = ["Butaleja"]; // extend as needed

export default function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCand, setEditingCand] = useState(null);
  const [form, setForm] = useState({
    name: "",
    position: positions[0],
    district: districts[0],
  });

  // Filters state
  const [filters, setFilters] = useState({ name: "", position: "", district: "" });

  // Real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "candidates"), (snap) => {
      setCandidates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const openModal = (cand = null) => {
    if (cand) {
      setEditingCand(cand.id);
      setForm({ name: cand.name, position: cand.position, district: cand.district });
    } else {
      setEditingCand(null);
      setForm({ name: "", position: positions[0], district: districts[0] });
    }
    setFeedback({ text: "", type: "" });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ text: "Name is required", type: "error" });
      return;
    }
    try {
      if (editingCand) {
        await updateDoc(doc(db, "candidates", editingCand), {
          name: form.name.trim(),
          position: form.position,
          district: form.district,
        });
        setFeedback({ text: "Candidate updated", type: "success" });
      } else {
        await addDoc(collection(db, "candidates"), {
          name: form.name.trim(),
          position: form.position,
          district: form.district,
          createdAt: serverTimestamp(),
        });
        setFeedback({ text: "Candidate added", type: "success" });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await deleteDoc(doc(db, "candidates", id));
    } catch {
      setFeedback({ text: "Failed to delete", type: "error" });
    }
  };

  // Apply filters
  const filtered = candidates.filter((c) => {
    if (filters.name && !c.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.position && c.position !== filters.position) return false;
    if (filters.district && c.district !== filters.district) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Candidates</h2>
        <button
          onClick={() => openModal()}
          className="bg-purple-950 text-white px-2 py-1 rounded hover:bg-fuchsia-900"
        >
          + Add Candidate
        </button>
      </div>

      {feedback.text && (
        <div
          className={`p-2 rounded ${feedback.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Search name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="border p-1 rounded text-sm flex-1"
        />
        <select
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
          className="border p-1 rounded text-sm"
        >
          <option value="">All Positions</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <select
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          className="border p-1 rounded text-sm"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead className="bg-fuchsia-100">
            <tr>
              <th className="p-1 text-left">Name</th>
              <th className="p-1 text-left">Position</th>
              <th className="p-1 text-left">District</th>
              <th className="p-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-1">{c.name}</td>
                <td className="p-1">{c.position}</td>
                <td className="p-1">{c.district}</td>
                <td className="p-1 space-x-2">
                  <button
                    onClick={() => openModal(c)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-center text-fuchsia-500">
                  No candidates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h3 className="text-xl font-semibold">{editingCand ? "Edit Candidate" : "Add Candidate"}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                className="w-full border p-2 rounded text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full border p-2 rounded text-sm"
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full border p-2 rounded text-sm"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-950 text-white px-4 py-2 rounded text-sm hover:bg-fuchsia-900"
                >
                  {editingCand ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
