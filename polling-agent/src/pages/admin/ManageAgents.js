// src/pages/admin/ManageAgents.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../firebase";

// Administrative hierarchy
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

export default function ManageAgents() {
  const [agents, setAgents] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  // Modal state (add/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    district: "Butaleja",
    subcounty: "Bukooli North",
    parish: "Bwikhonge Parish",
    village: "Bukolu Village",
  });

  // Filters
  const [filters, setFilters] = useState({
    name: "",
    district: "",
    subcounty: "",
    parish: "",
    village: "",
  });

  const createAuthUser = httpsCallable(functions, "createAuthUser");

  // Subscribe to agent users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "agent");
      setAgents(list);
    });
    return unsub;
  }, []);

  // Open modal for add or edit
  const openModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setForm({
        name: agent.displayName || "",
        email: agent.email,
        password: "",
        district: agent.metadata?.district || "Butaleja",
        subcounty: agent.metadata?.subcounty || "Bukooli North",
        parish: agent.metadata?.parish || "Bwikhonge Parish",
        village: agent.metadata?.village || "Bukolu Village",
      });
    } else {
      setEditingAgent(null);
      setForm({
        name: "",
        email: "",
        password: "",
        district: "Butaleja",
        subcounty: "Bukooli North",
        parish: "Bwikhonge Parish",
        village: "Bukolu Village",
      });
    }
    setFeedback({ text: "", type: "" });
    setIsModalOpen(true);
  };

  // Handle create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });
    const { name, email, password, district, subcounty, parish, village } = form;
    if (!email) return setFeedback({ text: "Email is required", type: "error" });
    try {
      if (editingAgent) {
        await updateDoc(doc(db, "users", editingAgent.id), {
          displayName: name,
          metadata: { district, subcounty, parish, village },
        });
        setFeedback({ text: "Agent updated successfully", type: "success" });
      } else {
        if (!password) return setFeedback({ text: "Password is required", type: "error" });
        await createAuthUser({
          email: email.trim(),
          password,
          role: "agent",
          displayName: name,
          metadata: { district, subcounty, parish, village },
        });
        setFeedback({ text: "Agent created successfully", type: "success" });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  // Toggle enable/disable
  const toggleDisabled = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { disabled: !user.disabled });
    } catch {
      setFeedback({ text: "Failed to update status", type: "error" });
    }
  };

  // Apply filters
  const filtered = agents.filter((a) => {
    if (filters.name && !a.displayName?.toLowerCase().includes(filters.name.toLowerCase())) return false;
    const md = a.metadata || {};
    if (filters.district && md.district !== filters.district) return false;
    if (filters.subcounty && md.subcounty !== filters.subcounty) return false;
    if (filters.parish && md.parish !== filters.parish) return false;
    if (filters.village && md.village !== filters.village) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Agents</h2>
        <button onClick={() => openModal()} className="bg-purple-950 text-white px-2 py-1 rounded text-xs hover:bg-fuchsia-900">Add Agent</button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-white p-2 rounded shadow text-xs">
        <input
          type="text"
          placeholder="Search name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="p-1 border rounded"
        />
        <select
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value, subcounty: '', parish: '', village: '' })}
          className="p-1 border rounded"
        >
          <option value="">All Districts</option>
          {Object.keys(adminHierarchy).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.subcounty}
          onChange={(e) => setFilters({ ...filters, subcounty: e.target.value, parish: '', village: '' })}
          className="p-1 border rounded"
          disabled={!filters.district}
        >
          <option value="">All Subcounties</option>
          {filters.district && Object.keys(adminHierarchy[filters.district]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.parish}
          onChange={(e) => setFilters({ ...filters, parish: e.target.value, village: '' })}
          className="p-1 border rounded"
          disabled={!filters.subcounty}
        >
          <option value="">All Parishes</option>
          {filters.district && filters.subcounty && Object.keys(adminHierarchy[filters.district][filters.subcounty]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.village}
          onChange={(e) => setFilters({ ...filters, village: e.target.value })}
          className="p-1 border rounded"
          disabled={!filters.parish}
        >
          <option value="">All Villages</option>
          {filters.district && filters.subcounty && filters.parish && adminHierarchy[filters.district][filters.subcounty][filters.parish].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Agents Table */}
      <div className="bg-white p-2 rounded shadow overflow-x-auto text-xs">
        <table className="w-full">
          <thead className="bg-fuchsia-100">
            <tr>
              <th className="p-1 text-left">Name</th>
              <th className="p-1 text-left">Email</th>
              <th className="p-1 text-left">Area</th>
              <th className="p-1 text-left">Status</th>
              <th className="p-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-1">{user.displayName || '-'}</td>
                <td className="p-1">{user.email}</td>
                <td className="p-1">{`${user.metadata?.district}, ${user.metadata?.subcounty}, ${user.metadata?.parish}, ${user.metadata?.village}`}</td>
                <td className="p-1">{user.disabled ? 'Disabled' : 'Active'}</td>
                <td className="p-1 space-x-1">
                  <button onClick={() => openModal(user)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => toggleDisabled(user)} className="text-red-600 hover:underline">{user.disabled ? 'Enable' : 'Disable'}</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-1 text-center text-gray-500">
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-full max-w-md text-xs">
            <h3 className="text-lg font-semibold mb-2">{editingAgent ? 'Edit Agent' : 'Add New Agent'}</h3>
            {feedback.text && (
              <div className={`p-1 rounded mb-2 ${feedback.type === 'success' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-red-100 text-red-700'}`}>{feedback.text}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-1 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-1 border rounded"
                required
                disabled={!!editingAgent}
              />
              {!editingAgent && (
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-1 border rounded"
                  required
                />
              )}
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value, subcounty: '', parish: '', village: '' })}
                  className="p-1 border rounded"
                >
                  {Object.keys(adminHierarchy).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={form.subcounty}
                  onChange={(e) => setForm({ ...form, subcounty: e.target.value, parish: '', village: '' })}
                  className="p-1 border rounded"
                  disabled={!form.district}
                >
                  {form.district && Object.keys(adminHierarchy[form.district]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={form.parish}
                  onChange={(e) => setForm({ ...form, parish: e.target.value, village: '' })}
                  className="p-1 border rounded"
                  disabled={!form.subcounty}
                >
                  {form.district && form.subcounty && Object.keys(adminHierarchy[form.district][form.subcounty]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  className="p-1 border rounded"
                  disabled={!form.parish}
                >
                  {form.district && form.subcounty && form.parish && adminHierarchy[form.district][form.subcounty][form.parish].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-1 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2 py-1 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 bg-purple-950 text-white rounded hover:bg-fuchsia-900"
                >
                  {editingAgent ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
