import "dotenv/config";
import { createAIProblem, processAITurn } from "../server/services/ai.js";
import { seedTopics } from "../shared/catalog.js";
try {
  const topic = seedTopics.find((t) => t.id === (process.argv[2] || "numbers"));
  if (!topic) throw new Error("Chủ đề kiểm tra không hợp lệ.");
  const problem = await createAIProblem(topic, "easy");
  console.log("Gemini generation verified:", {
    title: problem.title,
    problemLength: problem.problem.length,
  });
  const reply = await processAITurn(
    { ...problem, topic, step: 1, messages: [] },
    "Mình nghĩ đáp số là 9999.",
    false,
  );
  console.log("Gemini tutor verified:", {
    messageLength: reply.message.length,
    advance: reply.advance,
    complete: reply.complete,
  });
} catch (error) {
  console.error("AI_CHECK_FAILED:", error.message);
  process.exitCode = 1;
}
