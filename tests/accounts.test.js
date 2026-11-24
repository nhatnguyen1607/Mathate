import test from "node:test";
import assert from "node:assert/strict";
import { auth } from "../server/services/store.js";
import { listAccounts, updateAccount } from "../server/services/accounts.js";
const sample = {
  uid: "learner",
  email: "learner@example.com",
  displayName: "An",
  disabled: false,
  emailVerified: true,
  metadata: { creationTime: "2026-11-24", lastSignInTime: "2026-11-24" },
  providerData: [{ providerId: "password" }],
  customClaims: { admin: false },
  passwordHash: "never-return",
  tokensValidAfterTime: "never-return",
};
test("Account listing paginates and returns only public fields; exact search handles missing accounts", async (t) => {
  t.mock.method(auth, "listUsers", async (limit, token) => {
    assert.equal(limit, 50);
    assert.equal(token, "cursor");
    return { users: [sample], pageToken: "next" };
  });
  const result = await listAccounts({ pageToken: "cursor" });
  assert.equal(result.nextPageToken, "next");
  assert.equal(result.users[0].uid, "learner");
  assert.equal("passwordHash" in result.users[0], false);
  assert.equal("customClaims" in result.users[0], false);
  t.mock.method(auth, "getUserByEmail", async () => {
    throw Object.assign(new Error(), { code: "auth/user-not-found" });
  });
  assert.deepEqual(
    (await listAccounts({ query: "missing@example.com" })).users,
    [],
  );
});
test("Account updates protect self and admins; locking learners revokes sessions", async (t) => {
  t.mock.method(auth, "getUser", async (uid) => ({
    ...sample,
    uid,
    customClaims: { admin: uid === "admin" },
  }));
  let writes = 0,
    revokes = 0;
  t.mock.method(auth, "updateUser", async (uid, changes) => {
    writes++;
    return { ...sample, uid, ...changes };
  });
  t.mock.method(auth, "revokeRefreshTokens", async () => {
    revokes++;
  });
  await assert.rejects(updateAccount("self", { disabled: true }, "self"), {
    status: 409,
  });
  await assert.rejects(updateAccount("admin", { disabled: true }, "self"), {
    status: 409,
  });
  assert.equal(writes, 0);
  assert.equal(
    (await updateAccount("learner", { disabled: true }, "self")).disabled,
    true,
  );
  assert.equal(revokes, 1);
  await updateAccount("learner", { displayName: "Bình" }, "self");
  assert.equal(revokes, 1);
});
test("Admin account API rejects regular users, role escalation and invalid fields", async (t) => {
  const { app } = await import("../server/app.js");
  t.mock.method(auth, "verifyIdToken", async (token, revoked) => {
    assert.equal(revoked, true);
    return { uid: "self", admin: token === "admin" };
  });
  t.mock.method(auth, "listUsers", async () => ({ users: [sample] }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/admin/accounts`;
  assert.equal(
    (await fetch(base, { headers: { Authorization: "Bearer learner" } }))
      .status,
    403,
  );
  const list = await fetch(base, {
    headers: { Authorization: "Bearer admin" },
  });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).users.length, 1);
  for (const body of [
    { admin: true },
    { displayName: "" },
    { disabled: "false" },
    {},
  ]) {
    const response = await fetch(base + "/learner", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
});
