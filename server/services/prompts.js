import { GeminiPracticeService } from "../legacy/gemini/geminiPracticeService.js";
import { GeminiPracticeServiceTiSo } from "../legacy/gemini/geminiPracticeServiceTiSo.js";
import { GeminiPracticeServiceTimeVelocity } from "../legacy/gemini/geminiPracticeServiceTimeVelocity.js";
import { GeminiPracticeServiceSoThapPhan } from "../legacy/gemini/geminiPracticeServiceSoThapPhan.js";
import { GeminiChatService } from "../legacy/gemini/geminiChatService.js";
import { GeminiChatServiceTiSo } from "../legacy/gemini/geminiChatServiceTiSo.js";
import { GeminiChatServiceTimeVelocity } from "../legacy/gemini/geminiChatServiceTimeVelocity.js";
import { GeminiChatServiceSoThapPhan } from "../legacy/gemini/geminiChatServiceSoThapPhan.js";
import { withLegacyModel } from "../legacy/gemini/geminiModelManager.js";
import {
  adaptPracticePrompt,
  adaptTutorPrompt,
  difficultyBranches,
} from "../prompts/adapt-math-ai.js";
const practice = {
  general: GeminiPracticeService,
  decimal: GeminiPracticeServiceSoThapPhan,
  ratio: GeminiPracticeServiceTiSo,
  velocity: GeminiPracticeServiceTimeVelocity,
};
const chat = {
  general: GeminiChatService,
  decimal: GeminiChatServiceSoThapPhan,
  ratio: GeminiChatServiceTiSo,
  velocity: GeminiChatServiceTimeVelocity,
};

export function createPracticeService(topic) {
  const Service = practice[topic.promptType];
  if (!Service) throw new Error("Bộ prompt không hợp lệ.");
  const service = new Service();
  service._getProblemTypeLimitForBai = () => "";
  service._buildAntiDuplicateGuidance = () => "";
  service._getBepAnConstraint = () => "";
  const lessonGuidance = service._getLessonSpecificGuidance.bind(service);
  service._getLessonSpecificGuidance = (name) =>
    [lessonGuidance(name), topic.promptGuidance].filter(Boolean).join("\n");
  if (topic.promptType === "general") {
    const build = service._buildSimilarProblemPrompt.bind(service);
    service._buildSimilarProblemPrompt = (
      _unusedReference,
      context,
      difficulty,
      _unusedAssessment,
      focus,
      lesson,
    ) => build("", context, difficulty, "", focus, lesson, "");
  }
  return service;
}
export async function runPractice(topic, difficulty, generate) {
  if (!Object.hasOwn(difficultyBranches, difficulty))
    throw new Error("Độ khó không hợp lệ.");
  const service = createPracticeService(topic);
  let captured = "",
    failure;
  service._rateLimitedGenerate = async (raw) => {
    captured = adaptPracticePrompt(raw, difficulty);
    try {
      const text = await generate(captured);
      return { response: { text: () => text } };
    } catch (error) {
      failure = error;
      throw error;
    }
  };
  const problem = await service.generateSimilarProblem(
    "",
    "",
    topic.name,
    1,
    difficultyBranches[difficulty],
    undefined,
    "",
    "",
  );
  if (failure) throw failure;
  if (!captured) throw new Error("Không đọc được prompt tạo đề.");
  return { problem, prompt: captured };
}
export async function generationPrompt(topic, difficulty) {
  return (
    await runPractice(
      topic,
      difficulty,
      async () => '{"de_bai":"Đề tham chiếu"}',
    )
  ).prompt;
}
export function createTutorService(session) {
  const Service = chat[session.topic.promptType];
  if (!Service) throw new Error("Bộ prompt không hợp lệ.");
  const service = new Service();
  for (const key of ["wrongAttemptCount", "step4ChangedData", "step4Phase"]) {
    if (session.tutorState?.[key] !== undefined)
      service[key] = session.tutorState[key];
  }
  service.currentProblem = session.problem;
  service.currentStep = session.step;
  service.isSessionComplete = !!session.completed;
  return service;
}
export function tutorSystemPrompt(session) {
  return adaptTutorPrompt(createTutorService(session)._buildSystemPrompt());
}
export async function runTutor(session, message, hint, generate) {
  const service = createTutorService(session);
  const history = session.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
  let prompt = null;
  const result = await withLegacyModel(
    async (content) => {
      const raw =
        typeof content === "string"
          ? content
          : content.map((p) => p.text).join("\n\n");
      prompt = adaptTutorPrompt(raw);
      return generate(prompt);
    },
    () =>
      service.processStudentResponse(
        hint ? "Mình không biết, cho mình một gợi ý nhé." : message,
        history,
      ),
  );
  const tutorState = Object.fromEntries(
    ["wrongAttemptCount", "step4ChangedData", "step4Phase"]
      .filter((key) => service[key] !== undefined)
      .map((key) => [key, service[key]]),
  );
  return {
    message: result.message
      .replace(/Bạn hãy nộp bài luyện tập này[^.!?]*[.!?]?/gi, "")
      .trim(),
    correct: result.robotStatus === "correct",
    advance: !hint && service.currentStep > session.step,
    complete: !hint && service.isSessionComplete,
    tutorState,
    prompt,
  };
}
// Captures the original system + per-turn prompt, without contacting AI.
export async function tutorPrompt(session, message, hint = false) {
  return (
    await runTutor(session, message, hint, async () =>
      JSON.stringify({
        status: "WRONG",
        step_status: "STAY",
        feedback: "Bạn thử lại nhé.",
        next_question: "Bạn tìm được dữ kiện nào?",
      }),
    )
  ).prompt;
}
