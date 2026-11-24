import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin -- admin@example.com");
  process.exit(1);
}
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || "mathate-8cd62",
  credential: process.env.FIREBASE_SERVICE_ACCOUNT
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    : applicationDefault(),
});
const auth = getAuth(app),
  user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
console.log(
  "Admin role assigned. Sign out and sign in again to refresh the ID token.",
);
