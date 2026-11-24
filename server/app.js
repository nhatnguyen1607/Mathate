import express from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { auth, store, persistenceReady } from "./services/store.js";
import { createAIProblem, processAITurn } from "./services/ai.js";
import { demoProblem, demoReply } from "./services/demo.js";
import { synthesizeSpeech, ttsConfigured } from "./services/tts.js";
import { listAccounts, updateAccount } from "./services/accounts.js";
import { companions, themes } from "../shared/personalization.js";
import { avatarUploadSignature, verifyAvatar } from "./services/cloudinary.js";
export const app = express();
if (process.env.VERCEL === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  next();
});
const demoEnabled =
  process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production";
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    demoEnabled,
    persistenceReady,
    aiConfigured: !!process.env.GEMINI_API_KEY,
    ttsConfigured: ttsConfigured(),
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 90,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại nhé." },
  }),
);
app.use("/api", async (req, res, next) => {
  try {
    if (demoEnabled && req.headers["x-mathate-demo"]) {
      const id = z.string().uuid().parse(req.headers["x-mathate-demo"]);
      req.user = { uid: `demo-${id}`, demo: true, admin: false };
    } else {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token)
        return res
          .status(401)
          .json({ error: "Bạn đăng nhập để lưu hành trình nhé." });
      req.user = { ...(await auth.verifyIdToken(token, true)), demo: false };
    }
    next();
  } catch {
    res
      .status(401)
      .json({ error: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé." });
  }
});
const admin = (req, res, next) =>
  req.user.admin === true && !req.user.demo
    ? next()
    : res
        .status(403)
        .json({ error: "Chỉ quản trị viên mới có thể quản lý chủ đề." });
const aiLimit = rateLimit({
  windowMs: 60000,
  limit: 15,
  keyGenerator: (req) => req.user.uid,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Mimo cần nghỉ một chút. Bạn thử lại sau nhé." },
});
app.get("/api/admin/accounts", admin, async (req, res) => {
  res.set("Cache-Control", "no-store");
  const query = z
    .object({
      query: z.string().trim().max(254).optional(),
      pageToken: z.string().max(2000).optional(),
    })
    .parse(req.query);
  res.json(await listAccounts(query));
});
app.patch("/api/admin/accounts/:uid", admin, async (req, res) => {
  const uid = z.string().min(1).max(128).parse(req.params.uid);
  const changes = z
    .object({
      displayName: z.string().trim().min(1).max(60).optional(),
      disabled: z.boolean().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0)
    .parse(req.body);
  res.json(await updateAccount(uid, changes, req.user.uid));
});
const topicSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(200),
  category: z.enum(["numbers", "geometry", "life"]),
  icon: z.enum(["calculator", "shapes", "pie", "ruler", "percent", "rocket"]),
  color: z.enum(["green", "purple", "orange", "blue", "pink", "yellow"]),
  promptType: z.enum(["general", "decimal", "ratio", "velocity"]),
  promptGuidance: z.string().trim().min(10).max(2000),
  active: z.boolean(),
  order: z.number().int().min(0).max(1000).optional(),
});
const idSchema = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
app.get("/api/topics", async (req, res) =>
  res.json(await store.topics(req.user.demo, req.user.admin === true)),
);
app.get("/api/profile", async (req, res) =>
  res.json(await store.profile(req.user.uid, req.user.demo)),
);
app.patch("/api/profile", async (req, res) => {
  const changes = z
    .object({
      displayName: z.string().trim().min(1).max(60).optional(),
      nickname: z.string().trim().max(30).optional(),
      companion: z.enum(companions.map((c) => c.id)).optional(),
      theme: z.enum(themes.map((t) => t.id)).optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0)
    .parse(req.body);
  if (changes.displayName && !req.user.demo)
    await auth.updateUser(req.user.uid, { displayName: changes.displayName });
  res.json(await store.updateProfile(req.user.uid, req.user.demo, changes));
});
app.post("/api/profile/avatar/signature", async (req, res) => {
  if (req.user.demo)
    return res
      .status(403)
      .json({ error: "Bạn đăng nhập để tải ảnh đại diện nhé." });
  res.set("Cache-Control", "no-store");
  res.json(avatarUploadSignature(req.user.uid));
});
app.post("/api/profile/avatar", async (req, res) => {
  if (req.user.demo)
    return res
      .status(403)
      .json({ error: "Bạn đăng nhập để lưu ảnh đại diện nhé." });
  const upload = z
    .object({
      public_id: z.string().max(160),
      version: z.number().int().positive(),
      signature: z.string().length(40),
    })
    .strict()
    .parse(req.body);
  const avatarUrl = verifyAvatar(req.user.uid, upload);
  res.json(await store.updateProfile(req.user.uid, false, { avatarUrl }));
});
app.get("/api/history", async (req, res) =>
  res.json(await store.history(req.user.uid, req.user.demo)),
);
app.post("/api/topics", admin, async (req, res) => {
  const topic = topicSchema.parse(req.body);
  const id = randomUUID();
  await store.saveTopic(id, topic);
  res.status(201).json({ id, ...topic });
});
app.put("/api/topics/:id", admin, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const topic = topicSchema.parse(req.body);
  if (!(await store.topic(id, false)))
    return res.status(404).json({ error: "Không tìm thấy chủ đề." });
  await store.saveTopic(id, topic);
  res.json({ id, ...topic });
});
app.delete("/api/topics/:id", admin, async (req, res) => {
  await store.deleteTopic(idSchema.parse(req.params.id));
  res.status(204).end();
});
app.post("/api/topics/seed", admin, async (req, res) => {
  await store.seed();
  res.json({ ok: true });
});
const locks = new Set();
function publicSession(s) {
  const {
    answer,
    solution,
    uid,
    rewarded,
    demoData,
    expiresAt,
    tutorState,
    ...safe
  } = s;
  return {
    ...safe,
    topic: {
      id: s.topic.id,
      name: s.topic.name,
      icon: s.topic.icon,
      color: s.topic.color,
    },
  };
}
app.post("/api/sessions", aiLimit, async (req, res) => {
  const input = z
    .object({
      topicId: idSchema,
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
    .parse(req.body);
  const topic = await store.topic(input.topicId, req.user.demo);
  if (!topic?.active)
    return res
      .status(404)
      .json({ error: "Chủ đề này hiện chưa mở. Bạn chọn chủ đề khác nhé." });
  const problem = req.user.demo
    ? demoProblem(topic, input.difficulty)
    : await createAIProblem(topic, input.difficulty);
  const session = {
    id: randomUUID(),
    uid: req.user.uid,
    topic,
    difficulty: input.difficulty,
    title: problem.title,
    problem: problem.problem,
    ...(problem.answer
      ? { answer: problem.answer, solution: problem.solution }
      : {}),
    step: 1,
    hints: 0,
    completed: false,
    createdAt: new Date().toISOString(),
    messages: [
      {
        role: "model",
        text: "Chào bạn, mình là Mimo! Bạn hãy cho mình biết bài toán cho những thông tin gì và cần tìm điều gì nhé?",
        id: randomUUID(),
      },
    ],
    ...(req.user.demo ? { demoData: problem } : {}),
  };
  await store.saveSession(session, req.user.demo);
  res.status(201).json(publicSession(session));
});
app.get("/api/sessions/:id", async (req, res) => {
  const s = await store.getSession(
    idSchema.parse(req.params.id),
    req.user.demo,
  );
  if (!s || s.uid !== req.user.uid)
    return res.status(404).json({
      error: "Không tìm thấy bài học. Bạn quay về chọn một bài mới nhé.",
    });
  res.json(publicSession(s));
});
app.post("/api/sessions/:id/messages", aiLimit, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { message, hint, requestId } = z
    .object({
      message: z.string().trim().min(1).max(2000),
      hint: z.boolean().default(false),
      requestId: z.string().uuid(),
    })
    .parse(req.body);
  const lock = `${req.user.uid}:${id}`;
  if (locks.has(lock))
    return res
      .status(409)
      .json({ error: "Mimo đang trả lời. Bạn đợi một chút nhé." });
  locks.add(lock);
  try {
    let s = await store.getSession(id, req.user.demo);
    if (!s || s.uid !== req.user.uid)
      return res.status(404).json({ error: "Không tìm thấy bài học." });
    if (s.completed || s.messages.some((m) => m.requestId === requestId))
      return res.json(publicSession(s));
    if (s.messages.length >= 100)
      return res.status(400).json({
        error:
          "Bài học này đã có nhiều lượt trao đổi. Bạn chọn một bài mới nhé.",
      });
    const reply = req.user.demo
      ? demoReply(s, message, hint)
      : await processAITurn(s, message, hint);
    const complete = !hint && reply.correct && reply.complete && s.step === 4;
    const step =
      !hint && reply.correct && reply.advance
        ? Math.min(4, s.step + 1)
        : s.step;
    s = {
      ...s,
      step,
      hints: s.hints + (hint ? 1 : 0),
      robotStatus: hint ? "thinking" : reply.correct ? "correct" : "wrong",
      ...(reply.tutorState ? { tutorState: reply.tutorState } : {}),
      messages: [
        ...s.messages,
        { id: randomUUID(), role: "user", text: message, requestId },
        { id: randomUUID(), role: "model", text: reply.message, requestId },
      ],
    };
    if (complete) s = await store.complete(s, req.user.demo);
    else await store.saveSession(s, req.user.demo);
    res.json(publicSession(s));
  } finally {
    locks.delete(lock);
  }
});
app.post("/api/tts", aiLimit, async (req, res) => {
  const { text, voiceGender } = z
    .object({
      text: z
        .string()
        .trim()
        .min(1)
        .max(4500)
        .refine((value) => Buffer.byteLength(value, "utf8") <= 4500),
      voiceGender: z.enum(["FEMALE", "MALE"]).default("FEMALE"),
    })
    .parse(req.body);
  res.json(await synthesizeSpeech(text, voiceGender));
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Không tìm thấy chức năng này." }),
);
if (existsSync(resolve("dist/index.html"))) {
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
}
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: "Thông tin chưa hợp lệ. Bạn kiểm tra lại các ô nhập nhé.",
    });
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Dữ liệu gửi lên chưa hợp lệ." });
  console.error(
    `[${req.method} ${req.path}] ${err.name} (${err.status || 500})`,
  );
  res.status(err.status || 500).json({
    error: err.status ? err.message : "Có chút trục trặc. Bạn thử lại sau nhé.",
    ...(typeof err.code === "string" && err.code.startsWith("GEMINI_")
      ? { code: err.code }
      : {}),
  });
});
