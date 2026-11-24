import test from "node:test";
import assert from "node:assert/strict";
import { auth, store } from "../server/services/store.js";
import { cloudinarySignature } from "../server/services/cloudinary.js";

test("Avatar API accepts only signed uploads owned by the authenticated user", async (t) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL =
    "cloudinary://test-key:test-secret@example-cloud";
  t.after(() => {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  });
  const { app } = await import("../server/app.js");
  t.mock.method(auth, "verifyIdToken", async () => ({ uid: "avatar-owner" }));
  let writes = 0;
  t.mock.method(store, "updateProfile", async (uid, demo, changes) => {
    assert.equal(uid, "avatar-owner");
    assert.equal(demo, false);
    assert.deepEqual(Object.keys(changes), ["avatarUrl"]);
    writes++;
    return { xp: 20, ...changes };
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/profile/avatar`;
  const headers = {
    Authorization: "Bearer test-token",
    "Content-Type": "application/json",
  };
  const signed = await (
    await fetch(base + "/signature", { method: "POST", headers })
  ).json();
  const data = { public_id: signed.params.public_id, version: 123 };
  data.signature = cloudinarySignature(data, "test-secret");
  const response = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 200);
  assert.ok(
    (await response.json()).avatarUrl.startsWith(
      "https://res.cloudinary.com/example-cloud/",
    ),
  );
  const rejected = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...data, public_id: "another-user" }),
  });
  assert.equal(rejected.status, 400);
  assert.equal(writes, 1);
});
