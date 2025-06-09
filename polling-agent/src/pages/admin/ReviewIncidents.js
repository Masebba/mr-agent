// src/pages/admin/ReviewIncidents.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function ReviewIncidents() {
  const [incidents, setIncidents] = useState([]);

  // Real-time listener for all incident docs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncidents(list);
    });
    return unsub;
  }, []);

  const markResolved = async (inc) => {
    try {
      await updateDoc(doc(db, "incidents", inc.id), { status: "resolved" });
    } catch (err) {
      console.error("Error marking resolved:", err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Review Incidents</h2>

      {incidents.length === 0 ? (
        <p className="text-sm text-fuchsia-600">No incident reports.</p>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded shadow ${inc.status === "resolved" ? "bg-purple-100 border border-fuchsia-200" : "bg-white"
                }`}
            >
              <div className="flex justify-between">
                <h3 className="text-lg font-medium">{inc.headline}</h3>
                {inc.status !== "resolved" && (
                  <button
                    onClick={() => markResolved(inc)}
                    className="text-fuchsia-600 hover:underline text-sm"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Location:</strong> {inc.district} / {inc.subcounty} / {inc.parish} / {inc.village}
              </p>
              {inc.description && (
                <p className="text-sm text-gray-600 mb-2">{inc.description}</p>
              )}
              {inc.status === "resolved" && (
                <p className="text-sm text-green-700">Status: Resolved</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
