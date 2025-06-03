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

const positions = ["President", "Parliament", "Chairperson LCV"];
const districts = ["Butaleja"]; // extend as needed

export default function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("Parliament");
  const [newDistrict, setNewDistrict] = useState("Butaleja");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editDistrict, setEditDistrict] = useState("");

  // Real-time listener for all candidates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "candidates"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCandidates(list);
    });
    return unsub;
  }, []);

  // Add new candidate
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addDoc(collection(db, "candidates"), {
      name: newName.trim(),
      position: newPosition,
      district: newDistrict,
      createdAt: serverTimestamp(),
    });
    setNewName("");
    setNewPosition("Parliament");
    setNewDistrict("Butaleja");
  };

  // Begin editing
  const startEdit = (cand) => {
    setEditingId(cand.id);
    setEditName(cand.name);
    setEditPosition(cand.position);
    setEditDistrict(cand.district);
  };

  // Save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await updateDoc(doc(db, "candidates", editingId), {
      name: editName.trim(),
      position: editPosition,
      district: editDistrict,
    });
    setEditingId(null);
    setEditName("");
    setEditPosition("");
    setEditDistrict("");
  };

  // Delete candidate
  const handleDelete = async (id) => {
    if (window.confirm("Delete this candidate?")) {
      await deleteDoc(doc(db, "candidates", id));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Manage Candidates</h2>

      {/* Add Candidate Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded shadow space-y-2 max-w-md">
        <h3 className="text-xl">Add Candidate</h3>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Candidate Name"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Position</label>
          <select
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
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
          <label className="text-sm mb-1">District</label>
          <select
            value={newDistrict}
            onChange={(e) => setNewDistrict(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700 transition"
        >
          Add Candidate
        </button>
      </form>

      {/* List & Edit/Delete */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Position</th>
              <th className="p-2 text-left">District</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => (
              <tr key={cand.id} className="border-b">
                <td className="p-2">{cand.name}</td>
                <td className="p-2">{cand.position}</td>
                <td className="p-2">{cand.district}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => startEdit(cand)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cand.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal/Form */}
      {editingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow space-y-4 w-full max-w-md">
            <h3 className="text-xl">Edit Candidate</h3>
            <form onSubmit={handleSaveEdit} className="space-y-2">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">Position</label>
                <select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
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
                <label className="text-sm mb-1">District</label>
                <select
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-2 text-sm rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
