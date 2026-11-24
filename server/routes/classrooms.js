import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { auth, store } from "../services/store.js";
import { accountRole } from "../../shared/roles.js";
import { classrooms } from "../services/classrooms.js";
import { warmupQuestionSchema } from "../services/warmup-ai.js";
import { QUESTION_COUNT } from "../../shared/classrooms.js";
import { worksheetPDF } from "../services/worksheet-pdf.js";
export const classroomRouter = Router();
const id = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const futureDeadline = z
  .string()
  .datetime()
  .refine((value) => Date.parse(value) > Date.now(), "Hạn phải ở tương lai")
  .nullable();
const answerInput = z
  .object({
    answers: z
      .array(z.number().int().min(0).max(3).nullable())
      .length(QUESTION_COUNT),
    revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
classroomRouter.use(async (req, res, next) => {
  if (req.user.demo)
    return res
      .status(403)
      .json({ error: "Bạn đăng nhập tài khoản để tham gia lớp học nhé." });
  // Read current claims so revoking a teacher role takes effect even for an old ID token.
  const user = await auth.getUser(req.user.uid);
  if (user.disabled)
    return res.status(403).json({ error: "Tài khoản đã bị khóa." });
  req.classUser = {
    uid: user.uid,
    role: accountRole(user.customClaims),
    name: user.displayName || "",
  };
  for (const value of Object.values(req.params)) id.parse(value);
  next();
});
const teacher = (req, res, next) =>
  ["teacher", "admin"].includes(req.classUser.role)
    ? next()
    : res
        .status(403)
        .json({ error: "Chỉ giáo viên mới quản lý lớp và tạo đề." });
const student = (req, res, next) =>
  req.classUser.role === "student"
    ? next()
    : res
        .status(403)
        .json({ error: "Chức năng này dành cho tài khoản học sinh." });
const creationLimit = rateLimit({
  windowMs: 60000,
  limit: 12,
  keyGenerator: (req) => req.user.uid,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Thầy cô đang tạo nhiều đề. Vui lòng đợi một phút rồi thử lại.",
  },
});
const joinLimit = rateLimit({
  windowMs: 60000,
  limit: 8,
  keyGenerator: (req) => req.user.uid,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Bạn thử mã lớp nhiều lần rồi. Đợi một phút và hỏi lại thầy cô nhé.",
  },
});
classroomRouter.param("classId", (req, res, next, value) => {
  id.parse(value);
  next();
});
classroomRouter.param("activityId", (req, res, next, value) => {
  id.parse(value);
  next();
});
classroomRouter.param("groupId", (req, res, next, value) => {
  id.parse(value);
  next();
});
classroomRouter.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
classroomRouter.get("/", async (req, res) =>
  res.json(await classrooms.list(req.classUser)),
);
classroomRouter.post("/", teacher, async (req, res) => {
  const { name } = z
    .object({ name: z.string().trim().min(2).max(80) })
    .strict()
    .parse(req.body);
  res.status(201).json(await classrooms.create(req.classUser, name));
});
classroomRouter.post("/join", student, joinLimit, async (req, res) => {
  const { code, fullName } = z
    .object({
      code: z.string().regex(/^\d{5}$/),
      fullName: z.string().trim().min(2).max(80),
    })
    .strict()
    .parse(req.body);
  res.json(await classrooms.join(req.classUser, code, fullName));
});
classroomRouter.get("/:classId", async (req, res) =>
  res.json(await classrooms.detail(req.classUser, req.params.classId)),
);
classroomRouter.post(
  "/:classId/activities",
  teacher,
  creationLimit,
  async (req, res) => {
    const { topicId, deadline } = z
      .object({ topicId: id, deadline: futureDeadline.default(null) })
      .strict()
      .parse(req.body);
    const topic = await store.topic(topicId, false);
    if (!topic?.active)
      return res.status(404).json({ error: "Chủ đề chưa mở hoặc đã bị xóa." });
    res
      .status(201)
      .json(
        await classrooms.createActivity(
          req.classUser,
          req.params.classId,
          topic,
          deadline,
        ),
      );
  },
);
classroomRouter.get("/:classId/activities/:activityId", async (req, res) =>
  res.json(
    await classrooms.activity(
      req.classUser,
      req.params.classId,
      req.params.activityId,
    ),
  ),
);
classroomRouter.patch(
  "/:classId/activities/:activityId",
  teacher,
  async (req, res) => {
    const changes = z
      .object({
        deadline: futureDeadline.optional(),
        published: z.literal(true).optional(),
        applicationEnabled: z.boolean().optional(),
        questions: z
          .array(warmupQuestionSchema.extend({ id }))
          .length(QUESTION_COUNT)
          .optional(),
      })
      .strict()
      .refine((x) => Object.keys(x).length > 0)
      .parse(req.body);
    res.json(
      await classrooms.updateActivity(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        changes,
      ),
    );
  },
);
classroomRouter.post(
  "/:classId/activities/:activityId/attempt",
  student,
  async (req, res) =>
    res.json(
      await classrooms.attempt(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        "start",
      ),
    ),
);
classroomRouter.get(
  "/:classId/activities/:activityId/attempt",
  student,
  async (req, res) =>
    res.json(
      await classrooms.attempt(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        "read",
      ),
    ),
);
classroomRouter.patch(
  "/:classId/activities/:activityId/attempt",
  student,
  async (req, res) =>
    res.json(
      await classrooms.attempt(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        "save",
        answerInput.parse(req.body),
      ),
    ),
);
classroomRouter.post(
  "/:classId/activities/:activityId/attempt/submit",
  student,
  async (req, res) =>
    res.json(
      await classrooms.attempt(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        "submit",
        answerInput.parse(req.body),
      ),
    ),
);
classroomRouter.post(
  "/:classId/activities/:activityId/groups",
  teacher,
  async (req, res) => {
    const { rebuild } = z
      .object({ rebuild: z.boolean().default(false) })
      .strict()
      .parse(req.body);
    res.json(
      await classrooms.makePlan(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        rebuild,
      ),
    );
  },
);
classroomRouter.post(
  "/:classId/activities/:activityId/groups/:groupId/generate",
  teacher,
  creationLimit,
  async (req, res) => {
    const { planId } = z.object({ planId: id }).strict().parse(req.body);
    res.json(
      await classrooms.generateGroup(
        req.classUser,
        req.params.classId,
        req.params.activityId,
        planId,
        req.params.groupId,
      ),
    );
  },
);
classroomRouter.get(
  "/:classId/activities/:activityId/pdf",
  teacher,
  async (req, res) => {
    const groupId =
      req.query.groupId === undefined ? undefined : id.parse(req.query.groupId);
    const data = await classrooms.worksheet(
      req.classUser,
      req.params.classId,
      req.params.activityId,
      groupId,
    );
    const pdf = await worksheetPDF(data);
    res.set("Content-Type", "application/pdf");
    res.set(
      "Content-Disposition",
      'attachment; filename="mathate-phieu-luyen-tap.pdf"',
    );
    res.send(pdf);
  },
);
