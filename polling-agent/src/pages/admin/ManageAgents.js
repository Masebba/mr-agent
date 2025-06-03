// src/pages/admin/ManageAgents.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../firebase";

export default function ManageAgents() {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const createAuthUser = httpsCallable(functions, "createAuthUser");

  // Real-time listener for “agent” users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "agent");
      setUsers(list);
    });
    return unsub;
  }, []);

  // Create a new agent
  const handleAddAgent = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    if (!newEmail.trim() || !newPassword.trim()) {
      setFeedback({ text: "Email and password are required.", type: "error" });
      return;
    }

    try {
      await createAuthUser({
        email: newEmail.trim(),
        password: newPassword,
        role: "agent",
        displayName: newName.trim(),
      });
      setFeedback({
        text: `Created Agent: ${newEmail.trim()}`,
        type: "success",
      });
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  // Toggle disabled/enabled
  const toggleDisabled = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), {
        disabled: !user.disabled,
      });
    } catch (err) {
      console.error("Error toggling disabled:", err);
      setFeedback({ text: "Failed to update status.", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Manage Agents</h2>

      {/* ── New Agent Form ── */}
      <div className="bg-white p-4 rounded shadow max-w-md space-y-3">
        {feedback.text && (
          <div
            className={`text-sm p-2 rounded ${feedback.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {feedback.text}
          </div>
        )}
        <form onSubmit={handleAddAgent} className="space-y-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Display Name (optional)</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="Full name"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="agent@example.com"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="Temporary password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700 transition"
          >
            Create Agent
          </button>
        </form>
      </div>

      {/* ── Existing Agents List ── */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Display Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.displayName || "-"}</td>
                <td className="p-2 text-sm">
                  {user.disabled ? "Disabled" : "Active"}
                </td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => toggleDisabled(user)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    {user.disabled ? "Enable" : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-center text-gray-500">
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
