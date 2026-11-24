import "dotenv/config";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const projectId = process.env.FIREBASE_PROJECT_ID || "mathate-8cd62";
const app = initializeApp({
  projectId,
  credential: process.env.FIREBASE_SERVICE_ACCOUNT
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    : applicationDefault(),
});
let failed = false;
try {
  const result = await getAuth(app).listUsers(1);
  console.log(
    JSON.stringify({
      service: "Firebase Authentication",
      projectId,
      connected: true,
      hasRegisteredUsers: result.users.length > 0,
    }),
  );
} catch (error) {
  failed = true;
  console.error(
    JSON.stringify({
      service: "Firebase Authentication",
      connected: false,
      code: error.code || "unknown",
      message: error.message,
    }),
  );
}
try {
  const db = getFirestore(app);
  const result = await db.collection("topics").limit(1).get();
  console.log(
    JSON.stringify({
      service: "Firestore",
      projectId,
      connected: true,
      hasTopics: !result.empty,
    }),
  );
  await db
    .collection("sessions")
    .where("uid", "==", "__mathate_connection_check__")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  console.log(
    JSON.stringify({ service: "Firestore history index", ready: true }),
  );
} catch (error) {
  failed = true;
  console.error(
    JSON.stringify({
      service: "Firestore",
      connected: false,
      code: error.code || "unknown",
      message: error.message,
    }),
  );
}
process.exitCode = failed ? 1 : 0;
