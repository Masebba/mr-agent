// src/pages/Incidents.js
import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, app } from "../firebase";

// ── 1) Hardcoded hierarchy keyed by “Butaleja” ──
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

// ── 2) Flatten all villages safely ──
const hierarchy = adminHierarchy["Butaleja"] || {};
const allVillages = [];
Object.values(hierarchy).forEach((subObj) => {
  Object.values(subObj).forEach((villageArr) => {
    Array.isArray(villageArr) &&
      villageArr.forEach((v) => allVillages.push(v));
  });
});

export default function Incidents() {
  // 3) Village dropdown state
  const [village, setVillage] = useState(allVillages[0] || "");

  // 4) Form fields
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");

  // 5) Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 6) Feedback
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const storage = getStorage(app);

  // 7) Handle photo input
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  // 8) Submit incident
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    if (!headline.trim()) {
      setFeedback({ text: "Subject is required.", type: "error" });
      return;
    }

    // 8a) Upload photo if present
    let photoUrl = "";
    if (photoFile) {
      try {
        const path = `incidentPhotos/${Date.now()}_${photoFile.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, photoFile);
        photoUrl = await getDownloadURL(ref);
      } catch (err) {
        console.error("Photo upload failed:", err);
        setFeedback({ text: "Failed to upload photo.", type: "error" });
        return;
      }
    }

    // 8b) Save to Firestore
    try {
      await addDoc(collection(db, "incidents"), {
        headline: headline.trim(),
        description: description.trim(),
        district: "Butaleja",
        village,
        photoUrl,
        createdAt: serverTimestamp(),
      });
      setFeedback({ text: "Incident reported!", type: "success" });
      // reset form
      setHeadline("");
      setDescription("");
      setVillage(allVillages[0] || "");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error("Incident save failed:", err);
      setFeedback({ text: "Failed to report incident.", type: "error" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Report an Incident</h1>

      {feedback.text && (
        <div
          className={`mb-4 p-2 rounded text-sm ${
            feedback.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow space-y-4"
      >
        {/* Subject */}
        <div className="flex flex-col">
          <label htmlFor="headline" className="text-sm font-medium mb-1">
            Subject
          </label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Brief summary"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <label htmlFor="description" className="text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Details (optional)"
          />
        </div>

        {/* Village selector */}
        <div className="flex flex-col">
          <label htmlFor="village" className="text-sm font-medium mb-1">
            Village (Location)
          </label>
          <select
            id="village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            {(allVillages || []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col">
          <label htmlFor="photo" className="text-sm font-medium mb-1">
            Photo
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-full text-sm"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="mt-2 h-32 object-contain rounded border"
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-fuchsia-950 text-white p-2 rounded text-sm hover:bg-purple-950 transition"
        >
          Submit Incident
        </button>
      </form>
    </div>
  );
}
