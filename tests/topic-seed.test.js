import test from "node:test";
import assert from "node:assert/strict";

test("Seed rejects non-admins and a Firestore failure returns JSON without dropping backend", async (t) => {
  const { app } = await import("../server/app.js");
  const { auth, store } = await import("../server/services/store.js");
  t.mock.method(auth, "verifyIdToken", async (token) => ({
    uid: "seed-test",
    admin: token === "test-admin",
  }));
  let calls = 0;
  t.mock.method(store, "seed", async () => {
    calls++;
    if (calls === 2) throw new Error("simulated storage failure");
  });
  t.mock.method(console, "error", () => {});
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const seed = (token) =>
    fetch(`${base}/api/topics/seed`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  assert.equal((await seed("test-user")).status, 403);
  assert.equal(calls, 0);
  assert.equal((await seed("test-admin")).status, 200);
  const failed = await seed("test-admin");
  assert.equal(failed.status, 500);
  assert.ok((await failed.json()).error);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal((await seed("test-admin")).status, 200);
});
