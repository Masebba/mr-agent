// src/pages/Settings.js
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut, sendPasswordResetEmail, updateProfile } from "firebase/auth";

export default function Settings() {
    const { currentUser, role } = useAuth();

    // State for updating display name (if desired)
    const [displayName, setDisplayName] = useState(currentUser.displayName || "");
    const [nameFeedback, setNameFeedback] = useState({ text: "", type: "" });

    // State for password reset
    const [pwFeedback, setPwFeedback] = useState({ text: "", type: "" });

    // Handle display name update
    const handleUpdateName = async (e) => {
        e.preventDefault();
        setNameFeedback({ text: "", type: "" });
        const newNameTrimmed = displayName.trim();
        if (!newNameTrimmed) {
            setNameFeedback({ text: "Name cannot be empty.", type: "error" });
            return;
        }
        try {
            await updateProfile(currentUser, { displayName: newNameTrimmed });
            setNameFeedback({ text: "Name updated successfully.", type: "success" });
        } catch (err) {
            console.error("Error updating name:", err);
            setNameFeedback({ text: "Failed to update name. Try again.", type: "error" });
        }
    };

    // Handle sending password-reset email
    const handlePasswordReset = async () => {
        setPwFeedback({ text: "", type: "" });
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setPwFeedback({ text: "Password reset email sent. Check your inbox.", type: "success" });
        } catch (err) {
            console.error("Error sending reset email:", err);
            setPwFeedback({ text: "Failed to send reset email. Try again.", type: "error" });
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // After signOut, ProtectedRoute will redirect to /login
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-semibold">Settings</h1>

            {/* User Info */}
            <div className="bg-white p-4 rounded shadow space-y-2">
                <p className="text-sm">
                    <strong>Email:</strong> {currentUser.email}
                </p>
                <p className="text-sm">
                    <strong>Role:</strong> {role || "N/A"}
                </p>
            </div>

            {/* Update Display Name */}
            <div className="bg-white p-4 rounded shadow space-y-2">
                <h2 className="text-xl font-medium">Update Display Name</h2>
                {nameFeedback.text && (
                    <div
                        className={`text-sm p-1 rounded ${nameFeedback.type === "success"
                            ? "bg-purple-100 text-fuchsia-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {nameFeedback.text}
                    </div>
                )}
                <form onSubmit={handleUpdateName} className="flex flex-col space-y-2">
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Enter new display name"
                    />
                    <button
                        type="submit"
                        className="self-start bg-fuchsia-900 text-white p-2 rounded text-sm hover:bg-fuchsia-700 transition"
                    >
                        Update Name
                    </button>
                </form>
            </div>

            {/* Password Reset */}
            <div className="bg-white p-4 rounded shadow space-y-2">
                <h2 className="text-xl font-medium">Change Password</h2>
                {pwFeedback.text && (
                    <div
                        className={`text-sm p-1 rounded ${pwFeedback.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {pwFeedback.text}
                    </div>
                )}
                <button
                    onClick={handlePasswordReset}
                    className="bg-yellow-600 text-white p-2 rounded text-sm hover:bg-yellow-700 transition"
                >
                    Send Password Reset Email
                </button>
            </div>

            {/* Sign Out */}
            <div className="bg-white p-4 rounded shadow">
                <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-white p-2 rounded text-sm hover:bg-red-700 transition"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
