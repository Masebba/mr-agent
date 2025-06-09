// src/pages/admin/Reports.js
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

// Administrative hierarchy (reuse same as other pages)
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

// Position options matching candidate page
const positions = [
  "President",
  "Member of Parliament",
  "Woman Member of Parliament",
  "Chairperson LCV",
];

export default function Reports() {
  // Filters state
  const [position, setPosition] = useState("Member of Parliament");
  const [district, setDistrict] = useState("Butaleja");
  const [subcounty, setSubcounty] = useState(Object.keys(adminHierarchy["Butaleja"])[0]);
  const [parish, setParish] = useState(
    Object.keys(adminHierarchy["Butaleja"][subcounty])[0]
  );
  const [village, setVillage] = useState(
    adminHierarchy["Butaleja"][subcounty][parish][0]
  );

  // Data state
  const [candidates, setCandidates] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [loading, setLoading] = useState(true);

  // Reset dependent filters
  useEffect(() => {
    const firstSub = Object.keys(adminHierarchy[district])[0];
    setSubcounty(firstSub);
    const firstPar = Object.keys(adminHierarchy[district][firstSub])[0];
    setParish(firstPar);
    const firstVil = adminHierarchy[district][firstSub][firstPar][0];
    setVillage(firstVil);
  }, [district]);

  useEffect(() => {
    const parishes = Object.keys(adminHierarchy[district][subcounty] || {});
    const newPar = parishes[0] || "";
    setParish(newPar);
    const villages = adminHierarchy[district][subcounty]?.[newPar] || [];
    setVillage(villages[0] || "");
  }, [district, subcounty]);

  useEffect(() => {
    const villages = adminHierarchy[district][subcounty]?.[parish] || [];
    setVillage(villages[0] || "");
  }, [district, subcounty, parish]);

  // Load report data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      // fetch candidates for position
      const candQ = query(
        collection(db, "candidates"),
        where("position", "==", position),
        where("district", "==", district)
      );
      const candSnap = await getDocs(candQ);
      const candList = candSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));

      // init totals
      const totals = {};
      candList.forEach((c) => (totals[c.id] = 0));

      // fetch votes matching all filters
      const voteQ = query(
        collection(db, "votes"),
        where("position", "==", position),
        where("district", "==", district),
        where("subcounty", "==", subcounty),
        where("parish", "==", parish),
        where("village", "==", village)
      );
      const voteSnap = await getDocs(voteQ);
      voteSnap.docs.forEach((v) => {
        const d = v.data();
        if (d.candidateId in totals) totals[d.candidateId] += d.votes || 0;
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
  }, [position, district, subcounty, parish, village]);

  const downloadCSV = () => {
    let csv = "Candidate,Total Votes\n";
    candidates.forEach((c) => {
      csv += `"${c.name}",${voteTotals[c.id] || 0}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${district}_${subcounty}_${parish}_${village}_${position}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reports</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-white p-2 rounded shadow text-xs">
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="p-1 border rounded"
        >
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="p-1 border rounded"
        >
          {Object.keys(adminHierarchy).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={subcounty}
          onChange={(e) => setSubcounty(e.target.value)}
          className="p-1 border rounded"
        >
          {Object.keys(adminHierarchy[district]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={parish}
          onChange={(e) => setParish(e.target.value)}
          className="p-1 border rounded"
        >
          {Object.keys(adminHierarchy[district][subcounty]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          className="p-1 border rounded"
        >
          {adminHierarchy[district][subcounty][parish].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <button
          onClick={downloadCSV}
          className="bg-purple-950 text-white p-1 rounded text-xs hover:bg-fuchsia-900"
        >
          Download CSV
        </button>
      </div>

      {/* Results table */}
      <div className="bg-white p-2 rounded shadow overflow-x-auto text-xs">
        {loading ? (
          <p className="text-sm text-gray-600">Loading data…</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-gray-600">No candidates for selected filters.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-1 text-left border">Candidate</th>
                <th className="p-1 text-left border">Total Votes</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-1 border">{c.name}</td>
                  <td className="p-1 border">{voteTotals[c.id] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
