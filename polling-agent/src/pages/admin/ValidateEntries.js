// src/pages/admin/ValidateEntries.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ValidateEntries() {
  // List of vote submissions requiring approval
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all vote entries with status "pending"
    const q = query(
      collection(db, 'votes'),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubmissions(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Compute validation: accredited ?= sum(votes)+spoiled
  const validateSubmission = submission => {
    const { accredited, votesCast, spoiled } = submission;
    return accredited === (votesCast + spoiled);
  };

  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'votes', id), {
      status: 'approved',
      validated: true
    });
  };

  const handleReject = async (id) => {
    await updateDoc(doc(db, 'votes', id), {
      status: 'rejected',
      validated: false
    });
  };

  if (loading) return <p>Loading submissions...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Validate Vote Submissions</h2>
      {submissions.length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th className="border p-2">Agent</th>
              <th className="border p-2">Polling Station</th>
              <th className="border p-2">Accredited</th>
              <th className="border p-2">Votes Cast</th>
              <th className="border p-2">Spoiled</th>
              <th className="border p-2">Valid?</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub.id}>
                <td className="border p-2">{sub.agentName}</td>
                <td className="border p-2">{sub.village}</td>
                <td className="border p-2">{sub.accredited}</td>
                <td className="border p-2">{sub.votesCast}</td>
                <td className="border p-2">{sub.spoiled}</td>
                <td className="border p-2">
                  {validateSubmission(sub) ? '✅' : '❌'}
                </td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleApprove(sub.id)} className="text-green-600">Approve</button>
                  <button onClick={() => handleReject(sub.id)} className="text-red-600">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
