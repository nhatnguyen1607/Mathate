import "dotenv/config";
import { readFile } from "node:fs/promises";
import { GoogleAuth } from "google-auth-library";
import { store } from "../server/services/store.js";
const projectId = process.env.FIREBASE_PROJECT_ID || "mathate-8cd62";
if (projectId !== "mathate-8cd62")
  throw new Error("This setup targets the Mathate project only.");
const client = await new GoogleAuth({
  ...(process.env.FIREBASE_SERVICE_ACCOUNT
    ? { credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) }
    : {}),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
}).getClient();
const { indexes } = JSON.parse(
  await readFile(new URL("../firestore.indexes.json", import.meta.url), "utf8"),
);
await store.seed();
console.log(
  "Created any missing Mathate sample topics. Existing topic records were retained.",
);
for (const index of indexes) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${index.collectionGroup}/indexes`;
    const result = await client.request({ url, method: "GET" });
    const existing = result.data.indexes?.find(
      (value) =>
        value.queryScope === index.queryScope &&
        index.fields.every(
          (field, i) =>
            value.fields[i]?.fieldPath === field.fieldPath &&
            value.fields[i]?.order === field.order,
        ),
    );
    if (existing)
      console.log(
        JSON.stringify({
          collection: index.collectionGroup,
          existing: true,
          state: existing.state,
        }),
      );
    else {
      const created = await client.request({
        url,
        method: "POST",
        data: { queryScope: index.queryScope, fields: index.fields },
      });
      console.log(
        JSON.stringify({
          collection: index.collectionGroup,
          created: true,
          operation: created.data.name,
        }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        collection: index.collectionGroup,
        ready: false,
        code: error.response?.data?.error?.status || error.code || "unknown",
        message:
          "Could not create the index with this service account. Create it in Firebase Console with a project administrator account.",
      }),
    );
    process.exitCode = 1;
  }
}
