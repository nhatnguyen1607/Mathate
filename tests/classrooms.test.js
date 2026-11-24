import test from "node:test";
import assert from "node:assert/strict";
import {
  classroomFixture,
  fixtureQuestions,
  MemoryClassroomRepository,
} from "./support/classroom-fixture.js";
import { ClassroomService } from "../server/services/classrooms.js";
import { gradeWarmup, groupStudents } from "../shared/classrooms.js";
const student = { uid: "student", role: "student", name: "Nguyễn Bé An" };
test("Unique five-digit codes retry collisions atomically; joining is idempotent and private", async () => {
  const repository = new MemoryClassroomRepository();
  const codes = ["11111", "11111", "22222"];
  const service = new ClassroomService({
    repository,
    code: () => codes.shift(),
  });
  const teacher = { uid: "teacher", role: "teacher", name: "Cô Mai" };
  const [a, b] = await Promise.all([
    service.create(teacher, "Lớp A"),
    service.create(teacher, "Lớp B"),
  ]);
  assert.notEqual(a.code, b.code);
  assert.match(a.code, /^\d{5}$/);
  await Promise.all([
    service.join(student, a.code, "Nguyễn Bé An"),
    service.join(student, a.code, "Tên thay đổi"),
  ]);
  assert.equal((await service.detail(teacher, a.id)).members.length, 1);
  assert.equal((await service.list(student)).length, 1);
  await assert.rejects(
    service.detail({ uid: "stranger", role: "student" }, a.id),
    { status: 403 },
  );
  await assert.rejects(
    service.detail({ uid: "other-teacher", role: "teacher" }, a.id),
    { status: 403 },
  );
  await assert.rejects(service.join(student, "99999", "An"), { status: 404 });
});
test("Warmup starts once across concurrent requests, hides keys, saves revisions and grades only once", async () => {
  const f = await classroomFixture();
  await f.service.join(student, f.classroom.code, student.name);
  const args = [student, f.classroom.id, f.topic.id];
  const [a, b] = await Promise.all([
    f.service.attempt(...args, "start"),
    f.service.attempt(...args, "start"),
  ]);
  assert.equal(a.attempt.expiresAt, b.attempt.expiresAt);
  assert.equal(
    Date.parse(a.attempt.expiresAt) - Date.parse(a.attempt.startedAt),
    420000,
  );
  assert.equal(JSON.stringify(a).includes("correctIndex"), false);
  assert.equal(
    JSON.stringify(await f.service.activity(...args)).includes("questions"),
    false,
  );
  const correct = Array(8).fill(0),
    wrong = Array(8).fill(1);
  await f.service.attempt(...args, "save", { answers: correct, revision: 10 });
  await f.service.attempt(...args, "save", { answers: wrong, revision: 9 });
  assert.deepEqual(
    (await f.service.attempt(...args, "read")).attempt.answers,
    correct,
  );
  const submitted = await f.service.attempt(...args, "submit", {
    answers: correct,
    revision: 11,
  });
  assert.equal(submitted.attempt.result.score, 10);
  const replay = await f.service.attempt(...args, "submit", {
    answers: wrong,
    revision: 99,
  });
  assert.deepEqual(replay.attempt, submitted.attempt);
  assert.equal(
    (await f.service.attempt(...args, "start")).attempt.status,
    "submitted",
  );
  const view = await f.service.detail(student, f.classroom.id);
  assert.equal("members" in view, false);
  assert.equal(JSON.stringify(view).includes("correctIndex"), false);
});
test("Student class overview only summarizes their own published work and can resume a running warmup", async () => {
  const f = await classroomFixture({ students: 3, completed: 2 });
  await f.service.join(student, f.classroom.code, student.name);
  let list = await f.service.list(student);
  assert.equal(list[0].topicCount, 1);
  assert.equal(list[0].completedCount, 0);
  assert.equal(list[0].inProgressCount, 0);
  assert.equal(list[0].nextWarmup.started, false);
  assert.equal(JSON.stringify(list).includes("Nguyễn Minh An"), false);
  assert.equal(JSON.stringify(list).includes("correctIndex"), false);
  assert.equal("activities" in list[0], false);
  await f.service.createActivity(
    f.teacher,
    f.classroom.id,
    { ...f.topic, id: "draft-topic" },
    null,
  );
  await f.service.attempt(student, f.classroom.id, f.topic.id, "start");
  list = await f.service.list(student);
  assert.equal(list[0].topicCount, 1);
  assert.equal(list[0].inProgressCount, 1);
  assert.equal(list[0].nextWarmup.started, true);
  await f.service.attempt(student, f.classroom.id, f.topic.id, "submit", {
    answers: Array(8).fill(0),
    revision: 1,
  });
  list = await f.service.list(student);
  assert.equal(list[0].completedCount, 1);
  assert.equal(list[0].nextWarmup, null);
  assert.equal("score" in list[0], false);
});
test("Expiration uses saved answers and server time, survives closure, deadlines and stale clients", async () => {
  const f = await classroomFixture();
  await f.service.join(student, f.classroom.code, student.name);
  const args = [student, f.classroom.id, f.topic.id];
  await f.service.attempt(...args, "start");
  await f.service.attempt(...args, "save", {
    answers: [0, 0, null, null, null, null, null, null],
    revision: 1,
  });
  f.advance(420001);
  const expired = await f.service.attempt(...args, "submit", {
    answers: Array(8).fill(0),
    revision: 2,
  });
  assert.equal(expired.attempt.result.score, 2.5);
  assert.equal(expired.attempt.autoSubmitted, true);
  const late = { uid: "late", role: "student" };
  await f.service.join(late, f.classroom.code, "Học sinh vào muộn");
  const deadline = new Date(f.time + 30000).toISOString();
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    deadline,
  });
  const short = await f.service.attempt(
    late,
    f.classroom.id,
    f.topic.id,
    "start",
  );
  assert.equal(short.attempt.expiresAt, deadline);
  f.advance(31000);
  const teacherView = await f.service.activity(
    f.teacher,
    f.classroom.id,
    f.topic.id,
  );
  assert.equal(
    teacherView.results.find((r) => r.uid === "late").status,
    "submitted",
  );
  const newcomer = { uid: "new", role: "student" };
  await f.service.join(newcomer, f.classroom.code, "Em mới");
  await assert.rejects(
    f.service.attempt(newcomer, f.classroom.id, f.topic.id, "start"),
    { status: 410 },
  );
});
test("A shortened deadline closes an existing attempt; extending never creates a second attempt", async () => {
  const f = await classroomFixture();
  await f.service.join(student, f.classroom.code, student.name);
  await f.service.attempt(student, f.classroom.id, f.topic.id, "start");
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    deadline: new Date(f.time + 1000).toISOString(),
  });
  f.advance(1001);
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    deadline: new Date(f.time + 3600000).toISOString(),
  });
  const view = await f.service.detail(f.teacher, f.classroom.id);
  assert.equal(view.activities[0].submittedCount, 1);
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    deadline: null,
  });
  assert.equal(
    (await f.service.attempt(student, f.classroom.id, f.topic.id, "start"))
      .attempt.status,
    "submitted",
  );
});
test("Published quizzes are immutable and application access follows the teacher switch", async () => {
  const f = await classroomFixture();
  await f.service.join(student, f.classroom.code, student.name);
  await assert.rejects(
    f.service.application(student, f.classroom.id, f.topic.id),
    { status: 403 },
  );
  await assert.rejects(
    f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
      questions: fixtureQuestions,
    }),
    { status: 409 },
  );
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    applicationEnabled: true,
  });
  assert.equal(
    (await f.service.application(student, f.classroom.id, f.topic.id))
      .difficulty,
    "easy",
  );
  await f.service.updateActivity(f.teacher, f.classroom.id, f.topic.id, {
    applicationEnabled: false,
  });
  await assert.rejects(
    f.service.application(student, f.classroom.id, f.topic.id),
    { status: 403 },
  );
  await assert.rejects(
    f.service.updateActivity(
      { ...f.teacher, role: "student" },
      f.classroom.id,
      f.topic.id,
      { applicationEnabled: true },
    ),
    { status: 403 },
  );
});
test("Group snapshots sort by score, retain all names, include a small final group and retry AI failures", async () => {
  const f = await classroomFixture({ students: 13, completed: 13 });
  const view = await f.service.makePlan(f.teacher, f.classroom.id, f.topic.id);
  const overview = await f.service.list(f.teacher);
  assert.equal(overview[0].studentCount, 13);
  assert.equal(overview[0].topicCount, 1);
  assert.equal(overview[0].publishedCount, 1);
  assert.equal(overview[0].submittedCount, 13);
  assert.equal(JSON.stringify(overview).includes("correctIndex"), false);
  assert.deepEqual(
    view.groups.map((g) => g.members.length),
    [5, 5, 3],
  );
  assert.equal(
    new Set(view.groups.flatMap((g) => g.members.map((m) => m.uid))).size,
    13,
  );
  assert.ok(view.groups[0].members.every((m) => !!m.fullName));
  assert.equal(
    (await f.service.makePlan(f.teacher, f.classroom.id, f.topic.id)).plan.id,
    view.plan.id,
  );
  const exercise = f.service.exercise;
  f.service.exercise = async () => {
    throw new Error("provider offline");
  };
  await assert.rejects(
    f.service.generateGroup(
      f.teacher,
      f.classroom.id,
      f.topic.id,
      view.plan.id,
      view.groups[0].id,
    ),
  );
  f.service.exercise = exercise;
  for (const g of view.groups) {
    const result = await f.service.generateGroup(
      f.teacher,
      f.classroom.id,
      f.topic.id,
      view.plan.id,
      g.id,
    );
    assert.equal(result.exercises.length, 2);
    assert.equal(result.status, "ready");
  }
  const calls = f.exerciseCalls;
  await f.service.generateGroup(
    f.teacher,
    f.classroom.id,
    f.topic.id,
    view.plan.id,
    view.groups[0].id,
  );
  assert.equal(f.exerciseCalls, calls);
  await assert.rejects(
    f.service.worksheet(
      { uid: "fixture-student-01", role: "student" },
      f.classroom.id,
      f.topic.id,
    ),
    { status: 403 },
  );
  const printable = await f.service.worksheet(
    f.teacher,
    f.classroom.id,
    f.topic.id,
  );
  assert.equal(printable.groups.length, 3);
  const rebuilt = await f.service.makePlan(
    f.teacher,
    f.classroom.id,
    f.topic.id,
    true,
  );
  assert.notEqual(rebuilt.plan.id, view.plan.id);
  assert.ok(
    await f.repository.get(
      `classrooms/${f.classroom.id}/activities/${f.topic.id}/plans/${view.plan.id}`,
    ),
  );
});
test("Equal-weight scoring has no penalty or time bonus; group thresholds are reproducible", () => {
  assert.equal(
    gradeWarmup(fixtureQuestions, [0, null, null, null, null, null, null, null])
      .score,
    1.25,
  );
  assert.equal(
    gradeWarmup(fixtureQuestions, [0, 0, 0, 0, 0, 0, 0, null]).score,
    8.75,
  );
  assert.equal(
    gradeWarmup(fixtureQuestions, [0, 0, 0, 0, null, null, null, null]).score,
    5,
  );
  assert.equal(gradeWarmup(fixtureQuestions, Array(8).fill(1)).score, 0);
  const results = [8, 5, 4].map((score, i) => ({
    score,
    uid: String(i),
    fullName: "Em",
    joinedAt: String(i),
  }));
  assert.deepEqual(
    groupStudents(results).map((g) => g.difficulty),
    ["medium"],
  );
});
