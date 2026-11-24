import test from "node:test";
import assert from "node:assert/strict";
import { auth, store } from "../server/services/store.js";
import { classrooms } from "../server/services/classrooms.js";
import { classroomFixture } from "./support/classroom-fixture.js";
import { updateAccount, publicAccount } from "../server/services/accounts.js";
test("Teacher claims preserve other claims and only admins can assign teacher roles", async (t) => {
  const sample = {
    uid: "learner",
    displayName: "An",
    customClaims: { subscription: "existing" },
    metadata: {},
    providerData: [],
    disabled: false,
  };
  t.mock.method(auth, "getUser", async (uid) => ({
    ...sample,
    uid,
    customClaims: uid === "admin" ? { admin: true } : sample.customClaims,
  }));
  let claims;
  t.mock.method(auth, "setCustomUserClaims", async (uid, value) => {
    claims = value;
  });
  assert.equal(
    (await updateAccount("learner", { role: "teacher" }, "admin")).role,
    "teacher",
  );
  assert.deepEqual(claims, { subscription: "existing", role: "teacher" });
  assert.equal(
    (await updateAccount("learner", { role: "student" }, "admin")).role,
    "student",
  );
  await assert.rejects(updateAccount("admin", { role: "teacher" }, "admin"), {
    status: 409,
  });
  assert.equal(
    publicAccount({ ...sample, customClaims: { admin: true, role: "teacher" } })
      .role,
    "admin",
  );
});
test("Class API enforces fresh roles, ownership, answer secrecy, one attempt, gated chat and private PDFs", async (t) => {
  const f = await classroomFixture({ students: 2, completed: 2 });
  for (const key of ["repository", "quiz", "exercise", "now", "code"]) {
    const original = classrooms[key];
    classrooms[key] = f.service[key];
    t.after(() => {
      classrooms[key] = original;
    });
  }
  t.mock.method(auth, "verifyIdToken", async (token) => ({
    uid: token,
    role: token.includes("teacher") ? "teacher" : "student",
    admin: token === "admin",
  }));
  t.mock.method(auth, "getUser", async (uid) => ({
    uid,
    displayName: uid,
    disabled: false,
    customClaims: {
      role: ["fixture-teacher", "other-teacher"].includes(uid)
        ? "teacher"
        : "student",
    },
  }));
  t.mock.method(store, "topic", async () => f.topic);
  t.mock.method(store, "getSession", async () => ({
    id: "fixture-session",
    uid: "fixture-student-01",
    classId: f.classroom.id,
    activityId: f.topic.id,
    messages: [],
    topic: f.topic,
  }));
  const { app } = await import("../server/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, uid, method = "GET", body) =>
    fetch(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${uid}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const path = `/classrooms/${f.classroom.id}/activities/${f.topic.id}`;
  assert.equal(
    (await request("/classrooms", "revoked-teacher", "POST", { name: "Fake" }))
      .status,
    403,
  );
  assert.equal(
    (await request(`/classrooms/${f.classroom.id}`, "other-teacher")).status,
    403,
  );
  assert.equal(
    (await request(`/classrooms/${f.classroom.id}`, "outsider")).status,
    403,
  );
  assert.equal((await request(path, "fixture-teacher")).status, 200);
  const student = await request(path, "fixture-student-01");
  const studentData = await student.json();
  assert.equal("questions" in studentData, false);
  assert.equal("results" in studentData, false);
  assert.equal("groups" in studentData, false);
  assert.equal(
    (
      await request(path, "fixture-student-01", "PATCH", {
        applicationEnabled: true,
      })
    ).status,
    403,
  );
  assert.equal(
    (await request(path + "/groups", "fixture-student-01", "POST", {})).status,
    403,
  );
  assert.equal(
    (await request(path + "/pdf", "fixture-student-01")).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/admin/accounts/fixture-student-01",
        "fixture-student-01",
        "PATCH",
        { role: "teacher" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/sessions", "fixture-student-01", "POST", {
        topicId: f.topic.id,
        difficulty: "hard",
        classId: f.classroom.id,
        activityId: f.topic.id,
      })
    ).status,
    403,
  );
  assert.equal(
    (await request("/sessions/fixture-session", "fixture-student-01")).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/sessions/fixture-session/messages",
        "fixture-student-01",
        "POST",
        { message: "test", requestId: crypto.randomUUID() },
      )
    ).status,
    403,
  );
  const again = await request(path + "/attempt", "fixture-student-01", "POST");
  assert.equal((await again.json()).attempt.status, "submitted");
  const planResponse = await request(
    path + "/groups",
    "fixture-teacher",
    "POST",
    {},
  );
  const plan = await planResponse.json();
  assert.equal(planResponse.status, 200);
  assert.equal(
    (
      await request(
        path + `/groups/${plan.groups[0].id}/generate`,
        "fixture-teacher",
        "POST",
        { planId: plan.plan.id },
      )
    ).status,
    200,
  );
  const pdf = await request(path + "/pdf", "fixture-teacher");
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  const bytes = Buffer.from(await pdf.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 7000);
});
