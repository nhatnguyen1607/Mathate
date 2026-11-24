import { z } from "zod";
import { generateText, generateJSON } from "./gemini.js";
import { runPractice, runTutor } from "./prompts.js";

// Keep Math-AI's output formats. Conversion to Mathate's API happens in code.
export const legacyProblemSchema = z.object({
  de_bai: z.string().trim().min(15).max(3000),
  suy_luan: z.string().optional(),
});
export const legacyReplySchema = z.object({
  reasoning_process: z.string().optional(),
  status: z.enum(["CORRECT", "WRONG"]),
  step_status: z.enum(["STAY", "MOVE_NEXT"]),
  feedback: z.string().max(3000),
  next_question: z.string().max(3000).default(""),
});
export async function createAIProblem(topic, difficulty) {
  const { problem } = await runPractice(topic, difficulty, async (prompt) => {
    if (topic.promptType === "general") return generateText(prompt);
    return JSON.stringify(await generateJSON(prompt, legacyProblemSchema));
  });
  const text = z.string().trim().min(15).max(3000).parse(problem);
  return { title: topic.name, problem: text };
}
export async function processAITurn(session, message, hint) {
  const { prompt, ...reply } = await runTutor(
    session,
    message,
    hint,
    async (text) => JSON.stringify(await generateJSON(text, legacyReplySchema)),
  );
  return reply;
}
