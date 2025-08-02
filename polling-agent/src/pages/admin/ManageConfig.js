// src/pages/admin/ManageConfig.js
import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function ManageConfig() {
  // Configuration: districts hierarchy and positions
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [newDistrict, setNewDistrict] = useState("");
  const [newSubcounty, setNewSubcounty] = useState("");
  const [newParish, setNewParish] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  {/*
    
  // Fetch initial config
  useEffect(() => {
    async function fetchConfig() {
      const distSnap = await getDocs(collection(db, "config/districts/list"));
      setDistricts(distSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const posSnap = await getDocs(collection(db, "config/positions/list"));
      setPositions(posSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchConfig();
  }, []);
*/}

  useEffect(() => {
    // Districts
    const unsubD = onSnapshot(
      collection(db, "config/districts/list"),
      (snap) => setDistricts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // Positions
    const unsubP = onSnapshot(
      collection(db, "config/positions/list"),
      (snap) => setPositions(snap.docs.map(d => d.data().name))
    );
    return () => { unsubD(); unsubP(); };
  }, []);

  // Add new district
  const addDistrict = async () => {
    if (!newDistrict.trim()) return;
    try {
      await addDoc(collection(db, "config/districts/list"), { name: newDistrict.trim(), subunits: [] });
      setFeedback({ text: "District added", type: "success" });
      setNewDistrict("");
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  // Add subunit (subcounty->parish->village)
  const addSubunit = async () => {
    if (!selectedDistrict) return;
    const districtRef = doc(db, "config/districts/list", selectedDistrict);
    try {
      const data = (await districtRef.get()).data();
      const updated = [...data.subunits, { subcounty: newSubcounty, parishes: [{ name: newParish, villages: [newVillage] }] }];
      await updateDoc(districtRef, { subunits: updated });
      setFeedback({ text: "Subunit added", type: "success" });
      setNewSubcounty(""); setNewParish(""); setNewVillage("");
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  // Add position
  const addPosition = async () => {
    if (!newPosition.trim()) return;
    try {
      await addDoc(collection(db, "config/positions/list"), { name: newPosition.trim() });
      setFeedback({ text: "Position added", type: "success" });
      setNewPosition("");
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-semibold">Manage Configuration</h2>
      {feedback.text && <div className={feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} p-2 rounded>{feedback.text}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Districts */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Add District</h3>
          <input
            value={newDistrict}
            onChange={e => setNewDistrict(e.target.value)}
            placeholder="District name"
            className="w-full border p-2 rounded text-sm"
          />
          <button onClick={addDistrict} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Add District</button>
        </div>
        {/* Positions */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Add Position</h3>
          <input
            value={newPosition}
            onChange={e => setNewPosition(e.target.value)}
            placeholder="Position name"
            className="w-full border p-2 rounded text-sm"
          />
          <button onClick={addPosition} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Add Position</button>
        </div>

        {/* Subunits under a district */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Add Subcounty / Parish / Village</h3>
          <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="w-full border p-2 rounded text-sm">
            <option value="">Select District</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input
            value={newSubcounty}
            onChange={e => setNewSubcounty(e.target.value)}
            placeholder="Subcounty"
            className="w-full mt-2 border p-2 rounded text-sm"
          />
          <input
            value={newParish}
            onChange={e => setNewParish(e.target.value)}
            placeholder="Parish"
            className="w-full mt-2 border p-2 rounded text-sm"
          />
          <input
            value={newVillage}
            onChange={e => setNewVillage(e.target.value)}
            placeholder="Village"
            className="w-full mt-2 border p-2 rounded text-sm"
          />
          <button onClick={addSubunit} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Add Subunit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Display list of districts */}
        <div className="bg-white p-4 rounded shadow overflow-auto text-sm">
          <h3 className="font-semibold mb-2">Districts & Subunits</h3>
          {districts.map(d => <div key={d.id} className="mb-2">
            <strong>{d.name}</strong>
            <ul className="ml-4 list-disc">
              {d.subunits.map(sc => <li key={sc.subcounty}>{sc.subcounty}
                <ul className="ml-4 list-circle">
                  {sc.parishes.map(p => <li key={p.name}>{p.name}: {p.villages.join(", ")}</li>)}
                </ul>
              </li>)}
            </ul>
          </div>)}
        </div>

        {/* Display list of positions */}
        <div className="bg-white p-4 rounded shadow overflow-auto text-sm">
          <h3 className="font-semibold mb-2">Positions</h3>
          <ul className="list-disc ml-4">
            {positions.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
