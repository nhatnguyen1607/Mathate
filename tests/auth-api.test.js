import test from "node:test";
import assert from "node:assert/strict";
import { auth, store } from "../server/services/store.js";

test("API verifies JWT revocation before reading private data and does not cache responses", async (t) => {
  const checked = [];
  t.mock.method(auth, "verifyIdToken", async (token, revoked) => {
    checked.push({ token, revoked });
    if (token !== "valid-jwt")
      throw Object.assign(new Error("invalid"), {
        code: "auth/id-token-revoked",
      });
    return { uid: "student" };
  });
  let reads = 0;
  t.mock.method(store, "profile", async (uid) => {
    reads++;
    return { uid };
  });
  const { app } = await import("../server/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => server.close());
  const request = (token) =>
    fetch(`http://127.0.0.1:${server.address().port}/api/profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  assert.equal((await request()).status, 401);
  assert.equal((await request("revoked-jwt")).status, 401);
  assert.equal(reads, 0);
  const response = await request("valid-jwt");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(reads, 1);
  assert.ok(checked.every((call) => call.revoked === true));
  const forged = await fetch(
    `http://127.0.0.1:${server.address().port}/api/profile`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        xp: 99999,
        solved: 999,
        badges: ["hundred-problems"],
        bestStreak: 30,
      }),
    },
  );
  assert.equal(forged.status, 400);
  assert.equal(reads, 1);
});
