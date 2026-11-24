import { mkdir, writeFile } from "node:fs/promises";
import { seedTopics } from "../shared/catalog.js";
import {
  generationPrompt,
  tutorPrompt,
  tutorSystemPrompt,
} from "../server/services/prompts.js";
await mkdir("tmp/prompt-review", { recursive: true });
for (const topic of seedTopics) {
  for (const difficulty of ["easy", "medium", "hard"]) {
    await writeFile(
      `tmp/prompt-review/${topic.id}-${difficulty}.txt`,
      await generationPrompt(topic, difficulty),
    );
  }
  const session = {
    topic,
    step: 1,
    problem: "Mimo có 4 quả cam, thêm 2 quả. Hỏi có tất cả bao nhiêu quả?",
    messages: [],
  };
  await writeFile(
    `tmp/prompt-review/${topic.id}-chat-system.txt`,
    tutorSystemPrompt(session),
  );
  await writeFile(
    `tmp/prompt-review/${topic.id}-chat-turn.txt`,
    (await tutorPrompt(
      session,
      "Có 4 quả và thêm 2 quả, cần tìm tổng số quả.",
    )) || "Service gốc trả gợi ý có sẵn; không gọi AI ở lượt này.",
  );
}
console.log(
  "Exported practice, tutor system and sample turn prompts to tmp/prompt-review. No AI calls.",
);
