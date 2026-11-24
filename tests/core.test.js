import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { seedTopics, getLevel, awardedXP } from "../shared/catalog.js";
import {
  generationPrompt,
  tutorSystemPrompt,
} from "../server/services/prompts.js";
test("Level boundaries and capped hint deduction", () => {
  assert.equal(getLevel(0).number, 1);
  assert.equal(getLevel(99).number, 1);
  assert.equal(getLevel(100).number, 2);
  assert.equal(getLevel(1200).number, 5);
  assert.equal(getLevel(1200).progress, 100);
  assert.equal(awardedXP("easy", 99), 11);
  assert.equal(awardedXP("hard", 0), 50);
});
test("Every topic obtains its original practice and tutor prompts", async () => {
  for (const topic of seedTopics) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      const prompt = await generationPrompt(topic, difficulty);
      assert.ok(prompt.includes(topic.name));
      assert.ok(!prompt.includes("ĐIỀU CHỈNH CHO MATHATE"));
      assert.ok(
        !/khởi động|KHỞI ĐỘNG|HỌC SINH \"|BOI CANH VA TUYEN NHAN VAT/.test(
          prompt,
        ),
      );
      assert.ok(prompt.length > 1000);
      assert.ok(prompt.includes(topic.promptGuidance));
    }
    const prompt = tutorSystemPrompt({
      topic,
      step: 2,
      problem: "Bài thử",
      answer: "6",
      solution: "4+2",
      messages: [],
    });
    assert.ok(!prompt.includes("ĐIỀU CHỈNH MATHATE"));
    assert.ok(prompt.includes('"step_status": "STAY" hoặc "MOVE_NEXT"'));
    assert.ok(prompt.includes('"feedback"'));
    assert.ok(!prompt.includes('"advance"'));
  }
});
test("API practice, ownership, retries and XP are server-controlled", async (t) => {
  process.env.DEMO_MODE = "true";
  const { app } = await import("../server/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const identity = randomUUID();
  const request = async (
    path,
    body,
    id = identity,
    method = body ? "POST" : "GET",
  ) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(id ? { "X-Mathate-Demo": id } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };
  assert.equal((await request("/profile", null, null)).status, 401);
  assert.equal((await request("/topics", {}, identity)).status, 403);
  assert.equal(
    (await request("/sessions", { topicId: "numbers", difficulty: "bad" }))
      .status,
    400,
  );
  const created = await request("/sessions", {
    topicId: "numbers",
    difficulty: "easy",
  });
  assert.equal(created.status, 201);
  const s = created.data;
  assert.equal(s.step, 1);
  assert.equal(s.answer, undefined);
  assert.equal(s.solution, undefined);
  assert.equal(s.demoData, undefined);
  assert.equal(
    (await request(`/sessions/${s.id}`, null, randomUUID())).status,
    404,
  );
  assert.equal((await request("/profile")).data.xp, 0);
  const send = (message, hint = false, requestId = randomUUID()) =>
    request(`/sessions/${s.id}/messages`, { message, hint, requestId });
  const hint = await send("Cho gợi ý", true);
  assert.equal(hint.data.step, 1);
  assert.equal(hint.data.hints, 1);
  const wrong = await send("1000");
  assert.equal(wrong.data.step, 1);
  assert.equal((await send("Có 4 hạt và thêm 2 hạt")).data.step, 2);
  const duplicateId = randomUUID();
  const planned = await send("Mình cộng các hạt lại", false, duplicateId);
  assert.equal(planned.data.step, 3);
  const retried = await send("Mình cộng các hạt lại", false, duplicateId);
  assert.equal(retried.data.messages.length, planned.data.messages.length);
  assert.equal(retried.data.step, 3);
  assert.equal((await send("4 + 2 = 6 hạt giống")).data.step, 4);
  assert.equal((await send("đúng rồi")).data.completed, false);
  const complete = await send("Kiểm tra: 6 - 2 = 4 hạt giống");
  assert.equal(complete.data.completed, true);
  assert.equal(complete.data.xp, 17);
  const after = await request("/profile");
  assert.equal(after.data.xp, 17);
  assert.equal(after.data.solved, 1);
  assert.ok(after.data.badges.includes("first-step"));
  await send("6 - 2 = 4");
  assert.equal((await request("/profile")).data.xp, 17);
  assert.equal((await request("/profile")).data.solved, 1);
  assert.equal((await request("/history")).data[0].completed, true);
});
