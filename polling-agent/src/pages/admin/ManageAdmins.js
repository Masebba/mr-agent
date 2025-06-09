// src/pages/admin/ManageAdmins.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../firebase";

// Districts list
const districts = ["Butaleja", "Budaka"]; // add more as needed

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    district: districts[0],
  });

  const [filters, setFilters] = useState({
    name: "",
    district: "",
  });

  const createAuthUser = httpsCallable(functions, "createAuthUser");

  // Load admin users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "admin");
      setAdmins(list);
    });
    return unsub;
  }, []);

  const openModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setForm({
        name: admin.displayName || "",
        email: admin.email,
        password: "",
        district: admin.metadata?.district || districts[0],
      });
    } else {
      setEditingAdmin(null);
      setForm({ name: "", email: "", password: "", district: districts[0] });
    }
    setFeedback({ text: "", type: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });
    const { name, email, password, district } = form;
    if (!email) return setFeedback({ text: "Email required", type: "error" });
    try {
      if (editingAdmin) {
        await updateDoc(doc(db, "users", editingAdmin.id), {
          displayName: name,
          metadata: { district },
        });
        setFeedback({ text: "Admin updated", type: "success" });
      } else {
        if (!password) return setFeedback({ text: "Password required", type: "error" });
        await createAuthUser({
          email: email.trim(),
          password,
          role: "admin",
          displayName: name,
          metadata: { district },
        });
        setFeedback({ text: "Admin created", type: "success" });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const toggleDisabled = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { disabled: !user.disabled });
    } catch {
      setFeedback({ text: "Failed update status", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
    } catch {
      setFeedback({ text: "Failed to delete", type: "error" });
    }
  };

  const filtered = admins.filter((a) => {
    if (filters.name && !a.displayName?.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.district && a.metadata?.district !== filters.district) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Admins</h2>
        <button
          onClick={() => openModal()}
          className="bg-purple-950 text-white px-3 py-1 rounded text-sm hover:bg-fuchsia-900"
        >
          + Create Admin
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Search name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="border p-1 rounded text-sm"
        />
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

      {/* Feedback */}
      {feedback.text && (
        <div className={`p-2 rounded ${feedback.type === "success" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-red-100 text-red-700"}`}>
          {feedback.text}
        </div>
      )}

      {/* Admins Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">District</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2 text-center">{u.displayName}</td>
                <td className="p-2 text-center">{u.email}</td>
                <td className="p-2 text-center">{u.metadata?.district}</td>
                <td className="p-2 text-center">{u.disabled ? "Disabled" : "Active"}</td>
                <td className="p-2 space-x-2 flex justify-center items-center">
                  <button onClick={() => openModal(u)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  <button onClick={() => toggleDisabled(u)} className="text-yellow-500 hover:underline text-sm">
                    {u.disabled ? "Enable" : "Disable"}
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-2 text-center text-fuchsia-500">No admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">{editingAdmin ? "Edit Admin" : "Create Admin"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border p-2 rounded text-sm"
                required
              />
              {!editingAdmin && (
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                  required
                />
              )}
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
                <button type="submit" className="bg-purple-950 text-white px-4 py-2 rounded text-sm hover:bg-fuchsia-900">
                  {editingAdmin ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
