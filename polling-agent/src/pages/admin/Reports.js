// src/pages/admin/Reports.js
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const positions = ["President", "Parliament", "Chairperson LCV"];
const districts = ["Butaleja"];

export default function Reports() {
  const [position, setPosition] = useState("Parliament");
  const [district, setDistrict] = useState("Butaleja");
  const [candidates, setCandidates] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      // Fetch candidates
      const candQ = query(
        collection(db, "candidates"),
        where("position", "==", position),
        where("district", "==", district)
      );
      const candSnap = await getDocs(candQ);
      const candList = candSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));

      // Initialize totals
      const totals = {};
      candList.forEach((c) => {
        totals[c.id] = 0;
      });

      // Fetch votes
      const voteQ = query(
        collection(db, "votes"),
        where("position", "==", position),
        where("district", "==", district)
      );
      const voteSnap = await getDocs(voteQ);
      voteSnap.docs.forEach((vdoc) => {
        const d = vdoc.data();
        const cid = d.candidateId;
        const count = d.votes || 0;
        if (cid in totals) {
          totals[cid] += count;
        }
      });

      if (mounted) {
        setCandidates(candList);
        setVoteTotals(totals);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [position, district]);

  const downloadCSV = () => {
    let csv = "Candidate,Total Votes\n";
    candidates.forEach((c) => {
      const count = voteTotals[c.id] || 0;
      csv += `"${c.name}",${count}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${district}_${position}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Reports</h2>

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium mb-1">District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <p className="text-sm text-gray-600">Loading data…</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-gray-600">No candidates found.</p>
        ) : (
          <>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Candidate</th>
                  <th className="p-2 text-left">Total Votes</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{voteTotals[c.id] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={downloadCSV}
              className="mt-4 bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700"
            >
              Download CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}
