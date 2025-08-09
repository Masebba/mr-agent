// src/pages/admin/ManageConfig.js
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function ManageConfig() {
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [modal, setModal] = useState(null); // 'district'|'position'|'subunit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [filters, setFilters] = useState({
    district: "",
    constituency: "",
    subcounty: "",
    parish: "",
    pollingStation: "",
  });

  useEffect(() => {
    const unsubD = onSnapshot(
      collection(db, "config/districts/list"),
      (snap) =>
        setDistricts(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              subunits: Array.isArray(data.subunits) ? data.subunits : [],
            };
          })
        )
    );
    const unsubP = onSnapshot(
      collection(db, "config/positions/list"),
      (snap) =>
        setPositions(snap.docs.map((d) => ({ id: d.id, name: d.data().name })))
    );
    return () => {
      unsubD();
      unsubP();
    };
  }, []);

  const openModal = (type, data = {}) => {
    setEditing(data.id ? { ...data, type } : null);
    if (type === "district" || type === "position") {
      setForm({ name: data.name || "" });
    } else {
      setForm({
        districtId:   data.parentId || "",
        constituency: data.constituency || "",
        subcounty:    data.subcounty    || "",
        parish:       data.parish       || "",
        pollingStation: data.pollingStation || "",
      });
    }
    setModal(type);
    setFeedback({ text: "", type: "" });
  };
  const closeModal = () => {
    setModal(null);
    setEditing(null);
    setForm({});
  };

  const handleDistrict = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await updateDoc(doc(db, "config/districts/list", editing.id), {
          name: form.name.trim(),
        });
      } else {
        await addDoc(collection(db, "config/districts/list"), {
          name: form.name.trim(),
          subunits: [],
        });
      }
      closeModal();
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  const handlePosition = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await updateDoc(doc(db, "config/positions/list", editing.id), {
          name: form.name.trim(),
        });
      } else {
        await addDoc(collection(db, "config/positions/list"), {
          name: form.name.trim(),
        });
      }
      closeModal();
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  const handleSubunit = async () => {
    const { districtId, constituency, subcounty, parish, pollingStation } = form;
    if (!districtId.trim() || !constituency.trim()) return;
    try {
      const ref = doc(db, "config/districts/list", districtId);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      let subs = Array.isArray(data.subunits) ? data.subunits : [];

      if (editing) {
        subs = subs.filter((s) => s._id !== editing._unitId);
      }
      const unitId = editing ? editing._unitId : Date.now().toString();
      subs.push({
        _id: unitId,
        constituency: constituency.trim(),
        subcounty:    subcounty.trim(),
        parishes: [
          {
            name: parish.trim(),
            pollingStations: [pollingStation.trim()],
          },
        ],
      });
      await updateDoc(ref, { subunits: subs });
      closeModal();
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  const handleDelete = async ({ type, id, parentId }) => {
    if (!window.confirm("Delete?")) return;
    try {
      if (type === "district") {
        await deleteDoc(doc(db, "config/districts/list", id));
      } else if (type === "position") {
        await deleteDoc(doc(db, "config/positions/list", id));
      } else {
        const ref = doc(db, "config/districts/list", parentId);
        const snap = await getDoc(ref);
        const subs = (snap.data().subunits || []).filter((s) => s._id !== id);
        await updateDoc(ref, { subunits: subs });
      }
    } catch (e) {
      setFeedback({ text: e.message, type: "error" });
    }
  };

  // apply filters
  const displayed = districts
    .filter((d) => !filters.district || d.name === filters.district)
    .map((d) => ({
      ...d,
      subunits: d.subunits
        .filter((s) => {
          return (
            (!filters.constituency || s.constituency === filters.constituency) &&
            (!filters.subcounty    || s.subcounty    === filters.subcounty)    &&
            (!filters.parish       || s.parishes.some((p) => p.name === filters.parish)) &&
            (!filters.pollingStation ||
             s.parishes.some((p) =>
               (p.pollingStations || []).includes(filters.pollingStation)
             ))
          );
        })
        .map((s) => ({
          ...s,
          parishes: Array.isArray(s.parishes) ? s.parishes : [],
        })),
    }));

  return (
    <div className="space-y-4 p-4 text-xs">
      <h2 className="text-lg font-semibold">Manage Configuration</h2>

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        {["district","constituency","subcounty","parish","pollingStation"].map((f) => (
          (f==="district") ? (
            <select
              key={f}
              value={filters[f]}
              onChange={e => setFilters({ ...filters, [f]: e.target.value })}
              className="border p-1 rounded"
            >
              <option value="">All Districts</option>
              {districts.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          ) : (
            <input
              key={f}
              type="text"
              placeholder={f.charAt(0).toUpperCase()+f.slice(1)}
              value={filters[f]}
              onChange={e => setFilters({ ...filters, [f]: e.target.value })}
              className="border p-1 rounded flex-shrink"
            />
          )
        ))}
      </div>

      {/* actions */}
      <div className="flex gap-2">
        <button
          onClick={() => openModal("district")}
          className="bg-fuchsia-950 text-white px-2 py-1 rounded"
        >
          + District
        </button>
        <button
          onClick={() => openModal("subunit")}
          className="bg-fuchsia-950 text-white px-2 py-1 rounded"
        >
          + Constituency/Subcounty
        </button>
        <button
          onClick={() => openModal("position")}
          className="bg-fuchsia-950 text-white px-2 py-1 rounded"
        >
          + Position
        </button>
      </div>

      {feedback.text && (
        <div
          className={`p-1 rounded ${
            feedback.type === "success" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-red-100 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* hierarchy */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr className="text-xs">
              <th className="p-1 border">District</th>
              <th className="p-1 border">Constituency</th>
              <th className="p-1 border">Subcounty</th>
              <th className="p-1 border">Parish</th>
              <th className="p-1 border">Polling Station</th>
              <th className="p-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.flatMap((d) =>
              d.subunits.flatMap((s) =>
                s.parishes.flatMap((p) =>
                  (p.pollingStations || []).map((ps) => (
                    <tr key={`${d.id}-${s._id}-${p.name}-${ps}`} className="text-xs">
                      <td className="p-1 border">{d.name}</td>
                      <td className="p-1 border">{s.constituency}</td>
                      <td className="p-1 border">{s.subcounty}</td>
                      <td className="p-1 border">{p.name}</td>
                      <td className="p-1 border">{ps}</td>
                      <td className="p-1 border flex gap-1">
                        <button
                          onClick={() =>
                            openModal("subunit", {
                              id: s._id,
                              parentId: d.id,
                              _unitId: s._id,
                              constituency: s.constituency,
                              subcounty: s.subcounty,
                              parish: p.name,
                              pollingStation: ps,
                            })
                          }
                          className="text-fuchsia-950 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete({ type: "subunit", id: s._id, parentId: d.id })
                          }
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* modals */}
      {modal === "district" && (
        <Modal title={editing ? "Edit District" : "Add District"} onClose={closeModal}>
          <input
            className="w-full border p-1 rounded text-xs"
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="District Name"
          />
          <button onClick={handleDistrict} className="mt-2 bg-fuchsia-950 text-white px-2 py-1 rounded text-xs">
            {editing ? "Update" : "Create"}
          </button>
        </Modal>
      )}
      {modal === "position" && (
        <Modal title={editing ? "Edit Position" : "Add Position"} onClose={closeModal}>
          <input
            className="w-full border p-1 rounded text-xs"
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="Position Name"
          />
          <button onClick={handlePosition} className="mt-2 bg-fuchsia-950 text-white px-2 py-1 rounded text-xs">
            {editing ? "Update" : "Create"}
          </button>
        </Modal>
      )}
      {modal === "subunit" && (
        <Modal title={editing ? "Edit Subunit" : "Add Constituency/Subcounty"} onClose={closeModal}>
          <select
            className="w-full border p-1 rounded text-xs"
            value={form.districtId}
            onChange={(e) => setForm({ ...form, districtId: e.target.value })}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            className="w-full border p-1 rounded text-xs mt-1"
            placeholder="Constituency"
            value={form.constituency}
            onChange={(e) => setForm({ ...form, constituency: e.target.value })}
          />
          <input
            className="w-full border p-1 rounded text-xs mt-1"
            placeholder="Subcounty"
            value={form.subcounty}
            onChange={(e) => setForm({ ...form, subcounty: e.target.value })}
          />
          <input
            className="w-full border p-1 rounded text-xs mt-1"
            placeholder="Parish"
            value={form.parish}
            onChange={(e) => setForm({ ...form, parish: e.target.value })}
          />
          <input
            className="w-full border p-1 rounded text-xs mt-1"
            placeholder="Polling Station"
            value={form.pollingStation}
            onChange={(e) => setForm({ ...form, pollingStation: e.target.value })}
          />
          <button onClick={handleSubunit} className="mt-2 bg-fuchsia-950 text-white px-2 py-1 rounded text-xs">
            {editing ? "Update" : "Create"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow-lg w-full max-w-sm space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{title}</h4>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-sm">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
