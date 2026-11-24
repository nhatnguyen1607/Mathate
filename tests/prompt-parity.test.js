import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { withLegacyModel } from "../server/legacy/gemini/geminiModelManager.js";
import {
  createTutorService,
  runTutor,
  runPractice,
  generationPrompt,
  tutorSystemPrompt,
} from "../server/services/prompts.js";
import { difficulties, seedTopics } from "../shared/catalog.js";
const names = [
  "geminiPracticeService",
  "geminiPracticeServiceTiSo",
  "geminiPracticeServiceTimeVelocity",
  "geminiPracticeServiceSoThapPhan",
  "geminiChatService",
  "geminiChatServiceTiSo",
  "geminiChatServiceTimeVelocity",
  "geminiChatServiceSoThapPhan",
];
test("All eight imported services equal Math-AI, except import paths and provenance comment", async () => {
  for (const name of names) {
    const original = await readFile(
      new URL(`../../Math-AI/src/services/gemini/${name}.js`, import.meta.url),
      "utf8",
    );
    const expected =
      `// Imported from Math-AI/src/services/gemini/${name}.js. Prompt reference; see docs/ANALYSIS.md.\n` +
      original.replace(
        /from (["'])(\.[^"']+)\1/g,
        (_, quote, path) =>
          `from ${quote}${path.replace("../../constants/", "../constants/")}${path.endsWith(".js") ? "" : ".js"}${quote}`,
      );
    const copy = await readFile(
      new URL(`../server/legacy/gemini/${name}.js`, import.meta.url),
      "utf8",
    );
    assert.equal(copy, expected, `${name} diverged from the source`);
  }
});
test("Tutor system preserves the original rules and JSON contract", () => {
  for (const topic of seedTopics) {
    const session = {
      topic,
      problem: "Mimo có 4 quả, thêm 2 quả. Hỏi có tất cả bao nhiêu?",
      step: 1,
      messages: [],
    };
    const original = createTutorService(session)._buildSystemPrompt();
    const expected = original
      .replaceAll("HS lớp 5", "bạn")
      .replaceAll("học sinh lớp 5", "bạn")
      .replace(
        /^VAI TRÒ CỦA BẠN:.*\r?\n- Nhiệm vụ nhập vai:.*\r?\n- Hãy xưng hô thân thiện, nhất quán với vai trò này\.\r?\n/gm,
        "",
      );
    assert.equal(tutorSystemPrompt(session), expected);
    assert.ok(expected.includes("LUÔN TRẢ VỀ JSON"));
    assert.ok(expected.includes("TUYỆT ĐỐI"));
  }
});
test("Selected difficulty uses the original branch without student competency data", async () => {
  assert.equal(difficulties.easy.competency, undefined);
  const topic = seedTopics[0];
  const easy = await generationPrompt(topic, "easy"),
    medium = await generationPrompt(topic, "medium"),
    hard = await generationPrompt(topic, "hard");
  assert.ok(easy.includes("Chỉ 1 phép tính duy nhất"));
  assert.ok(medium.includes("Cùng số bước tính (1-2 bước)"));
  assert.ok(hard.includes("**CÓ 2 PHÉP TÍNH hoặc 1 phép tính phức tạp**"));
  await assert.rejects(() => generationPrompt(topic, "unknown"), /Độ khó/);
});
test("Legacy scaffolding state survives turns and resets when advancing", async () => {
  let session = {
    topic: seedTopics.find((t) => t.id === "fractions"),
    step: 2,
    problem: "Có 1,5 lít, thêm 0,5 lít, hỏi tổng bao nhiêu lít?",
    messages: [],
  };
  const wrong = JSON.stringify({
    status: "WRONG",
    step_status: "STAY",
    feedback: "Bạn thử lại nhé.",
    next_question: "Bạn sẽ làm như thế nào?",
  });
  const first = await runTutor(
    session,
    "Mình nhân hai số",
    false,
    async () => wrong,
  );
  assert.equal(first.tutorState.wrongAttemptCount, 1);
  session = { ...session, tutorState: first.tutorState };
  const second = await runTutor(
    session,
    "Mình chia hai số",
    false,
    async () => wrong,
  );
  assert.equal(second.tutorState.wrongAttemptCount, 2);
  const correct = await runTutor(
    { ...session, tutorState: second.tutorState },
    "Mình cộng hai lượng nước",
    false,
    async () =>
      JSON.stringify({
        status: "CORRECT",
        step_status: "MOVE_NEXT",
        feedback: "Đúng rồi.",
        next_question: "Bạn trình bày phép tính nhé?",
      }),
  );
  assert.equal(correct.advance, true);
  assert.equal(correct.tutorState.wrongAttemptCount, 0);
  assert.ok(correct.prompt.includes("wrong_attempt_count"));
  assert.ok(!correct.prompt.includes('"advance"'));
});
test("Original format is parsed without asking AI to emit Mathate's API format", async () => {
  const topic = seedTopics.find((t) => t.id === "fractions");
  const { problem, prompt } = await runPractice(topic, "easy", async () =>
    JSON.stringify({
      suy_luan: "Kiểm tra",
      de_bai:
        "Mimo có 1,5 lít nước, thêm 0,5 lít. Hỏi có tất cả bao nhiêu lít?",
    }),
  );
  assert.ok(problem.startsWith("Mimo có 1,5"));
  assert.ok(prompt.includes('"de_bai"'));
  assert.ok(!prompt.includes('"answer"'));
});
test("Concurrent legacy model handlers never cross user sessions", async () => {
  const manager = (
    await import("../server/legacy/gemini/geminiModelManager.js")
  ).default;
  const results = await Promise.all(
    ["A", "B"].map((value) =>
      withLegacyModel(
        async () => value,
        async () =>
          (
            await manager.getModel().generateContent("Bài toán")
          ).response.text(),
      ),
    ),
  );
  assert.deepEqual(results, ["A", "B"]);
});
