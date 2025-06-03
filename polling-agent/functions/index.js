// functions/index.js
/* eslint-disable */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Helper: Ensure the caller is “admin” or “superadmin”.
 * Throws an Error if not authorized.
 */
async function assertCallerIsAdminOrSuper(uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new Error("Caller not found in users collection");
  }
  const data = userDoc.data();
  if (data.disabled) {
    throw new Error("Your account is disabled");
  }
  if (data.role !== "admin" && data.role !== "superadmin") {
    throw new Error("Not authorized: must be admin or superadmin");
  }
  return data.role;
}

/**
 * Cloud Function: createAuthUser
 * - Only callable if the authenticated user is an admin or superadmin.
 * - Accepts { email, password, role, displayName }.
 * - “admin” callers can only create agents; “superadmin” callers can create either.
 */
exports.createAuthUser = functions.https.onCall(async (data, context) => {
  // 1) Must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to use this function"
    );
  }

  const callerUid = context.auth.uid;

  // 2) Verify caller’s role
  let callerRole;
  try {
    callerRole = await assertCallerIsAdminOrSuper(callerUid);
  } catch (err) {
    throw new functions.https.HttpsError("permission-denied", err.message);
  }

  // 3) Validate input
  const { email, password, role: newRole, displayName } = data;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !["agent", "admin"].includes(newRole)
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Fields required: email (string), password (string), role must be 'agent' or 'admin'"
    );
  }

  // 4) Admins cannot create another Admin
  if (callerRole === "admin" && newRole === "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admins cannot create another Admin"
    );
  }

  // 5) Create the new Auth user
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0]
    });
  } catch (err) {
    throw new functions.https.HttpsError("internal", err.message);
  }

  // 6) Write to Firestore /users/{uid}
  try {
    await db.collection("users").doc(userRecord.uid).set({
      email,
      role: newRole,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    // Roll back Auth creation if Firestore write fails
    await admin.auth().deleteUser(userRecord.uid);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to write user record to Firestore"
    );
  }

  // 7) Return the new user's UID
  return { uid: userRecord.uid };
});
