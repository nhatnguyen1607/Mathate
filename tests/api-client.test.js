import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/lib/api-client.js";

const reply = (status, data = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function fixture(request) {
  let token = "access-old",
    refreshes = 0,
    signouts = 0;
  const user = {
    uid: "student",
    async getIdToken(force = false) {
      if (force) {
        refreshes++;
        token = "access-new";
      }
      return token;
    },
  };
  const auth = { currentUser: user, authStateReady: async () => {} };
  const api = createApiClient({
    auth,
    demoId: () => null,
    signOut: async () => {
      signouts++;
      auth.currentUser = null;
    },
    fetch: request,
  });
  return {
    api,
    user,
    auth,
    get refreshes() {
      return refreshes;
    },
    get signouts() {
      return signouts;
    },
  };
}
test("API waits for restored Firebase session before reading its JWT", async () => {
  let restore,
    calls = 0;
  const f = fixture(async (url, options) => {
    calls++;
    assert.equal(options.headers.Authorization, "Bearer access-old");
    return reply(200, { saved: true });
  });
  f.auth.authStateReady = () =>
    new Promise((resolve) => {
      restore = resolve;
    });
  const result = f.api("/profile");
  assert.equal(calls, 0);
  restore();
  assert.deepEqual(await result, { saved: true });
  assert.equal(f.refreshes, 0);
});
test("Concurrent 401s refresh once and replay each exact JSON mutation once", async () => {
  const calls = [];
  const f = fixture(async (url, options) => {
    calls.push({ url, ...options });
    return options.headers.Authorization === "Bearer access-old"
      ? reply(401)
      : reply(200, { ok: true });
  });
  await Promise.all(
    [1, 2, 3].map((i) =>
      f.api("/sessions/test/messages", {
        method: "POST",
        body: { requestId: `same-${i}`, message: "6" },
      }),
    ),
  );
  assert.equal(f.refreshes, 1);
  assert.equal(calls.length, 6);
  for (const i of [1, 2, 3]) {
    const pair = calls.filter(
      (c) => JSON.parse(c.body).requestId === `same-${i}`,
    );
    assert.equal(pair.length, 2);
    assert.equal(pair[0].body, pair[1].body);
  }
  assert.equal(f.signouts, 0);
});
test("A permanently rejected JWT stops after one retry and clears the SDK session", async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return reply(401);
  });
  await assert.rejects(f.api("/profile"), { status: 401 });
  assert.equal(calls, 2);
  assert.equal(f.signouts, 1);
});
test("Invalid refresh token clears session without sending anonymous retries", async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return reply(401);
  });
  f.user.getIdToken = async (force) => {
    if (force)
      throw Object.assign(new Error("revoked"), {
        code: "auth/user-token-expired",
      });
    return "access-old";
  };
  await assert.rejects(f.api("/profile"), { status: 401 });
  assert.equal(calls, 1);
  assert.equal(f.signouts, 1);
});
test("Network failures and 403s never replay mutations or clear a valid session", async () => {
  for (const mode of ["network", "forbidden"]) {
    let calls = 0;
    const f = fixture(async () => {
      calls++;
      if (mode === "network") throw new TypeError("offline");
      return reply(403, { error: "Không có quyền" });
    });
    await assert.rejects(
      f.api("/topics", { method: "POST", body: { name: "test" } }),
    );
    assert.equal(calls, 1);
    assert.equal(f.refreshes, 0);
    assert.equal(f.signouts, 0);
  }
});
test("An account switch during refresh cannot send stale requests or sign out the new user", async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return reply(401);
  });
  const nextUser = { uid: "another-user" };
  f.user.getIdToken = async (force) => {
    if (force) f.auth.currentUser = nextUser;
    return force ? "new" : "old";
  };
  await assert.rejects(f.api("/profile"), { status: 401 });
  assert.equal(calls, 1);
  assert.equal(f.signouts, 0);
  assert.equal(f.auth.currentUser, nextUser);
});
test("Offline refresh preserves a restorable session and retries no mutation", async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return reply(401);
  });
  f.user.getIdToken = async (force) => {
    if (force)
      throw Object.assign(new Error("offline"), {
        code: "auth/network-request-failed",
      });
    return "old";
  };
  await assert.rejects(f.api("/profile"), /kiểm tra kết nối/);
  assert.equal(calls, 1);
  assert.equal(f.signouts, 0);
});
test("Demo and PDF responses keep existing API behavior", async () => {
  const api = createApiClient({
    auth: { currentUser: null, authStateReady: async () => {} },
    signOut: async () => assert.fail(),
    demoId: () => "demo-uuid",
    fetch: async (url, options) => {
      assert.equal(options.headers["X-Mathate-Demo"], "demo-uuid");
      assert.equal(options.headers.Authorization, undefined);
      return new Response("pdf-bytes");
    },
  });
  assert.equal(
    await (await api("/worksheet", { blob: true })).text(),
    "pdf-bytes",
  );
});
