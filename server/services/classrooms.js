import { randomInt, randomUUID } from "node:crypto";
import { classroomRepository } from "./classroom-repository.js";
import { generateWarmup } from "./warmup-ai.js";
import { createAIProblem } from "./ai.js";
import {
  WARMUP_SECONDS,
  gradeWarmup,
  groupStudents,
  skillNames,
} from "../../shared/classrooms.js";
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const classPath = (id) => `classrooms/${id}`;
const activityPath = (id, activityId) =>
  `${classPath(id)}/activities/${activityId}`;
const attemptPath = (id, activityId, uid) =>
  `${activityPath(id, activityId)}/attempts/${uid}`;
const safeClass = (c) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  teacherName: c.teacherName,
  createdAt: c.createdAt,
});
const safeActivity = (a) => ({
  id: a.id,
  topic: {
    id: a.topic.id,
    name: a.topic.name,
    icon: a.topic.icon,
    color: a.topic.color,
  },
  title: a.title,
  deadline: a.deadline,
  published: a.published,
  applicationEnabled: a.applicationEnabled,
  questionCount: a.questions.length,
  createdAt: a.createdAt,
  planId: a.planId || null,
});
const safeAttempt = (a) =>
  a
    ? {
        uid: a.uid,
        status: a.status,
        startedAt: a.startedAt,
        expiresAt: a.expiresAt,
        answers: a.answers,
        submittedAt: a.submittedAt || null,
        autoSubmitted: !!a.autoSubmitted,
        result: a.result || null,
        revision: a.revision || 0,
      }
    : null;
const questionView = (q) => ({
  id: q.id,
  text: q.text,
  options: q.options,
  skill: q.skill,
});
export class ClassroomService {
  constructor({
    repository = classroomRepository,
    quiz = generateWarmup,
    exercise = createAIProblem,
    now = () => Date.now(),
    code = () => String(randomInt(10000, 100000)),
  } = {}) {
    Object.assign(this, { repository, quiz, exercise, now, code });
  }
  iso() {
    return new Date(this.now()).toISOString();
  }
  async access(user, id, owner = false) {
    const c = await this.repository.get(classPath(id));
    if (!c) fail(404, "Không tìm thấy lớp học.");
    const owns =
      c.teacherId === user.uid && ["teacher", "admin"].includes(user.role);
    const member = owns
      ? null
      : await this.repository.get(`${classPath(id)}/members/${user.uid}`);
    if ((owner && !owns) || (!owns && !member))
      fail(403, "Bạn không có quyền truy cập lớp học này.");
    return { classroom: c, owns, member };
  }
  async list(user) {
    let classes;
    if (["teacher", "admin"].includes(user.role))
      classes = await this.repository.list("classrooms", {
        field: "teacherId",
        value: user.uid,
      });
    else {
      const memberships = await this.repository.list(
        `classMemberships/${user.uid}/classes`,
      );
      classes = (
        await Promise.all(
          memberships.map((m) => this.repository.get(classPath(m.classId))),
        )
      ).filter(Boolean);
    }
    const sorted = classes
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(safeClass);
    if (!["teacher", "admin"].includes(user.role))
      return Promise.all(
        sorted.map(async (c) => {
          const { activities, serverNow } = await this.detail(user, c.id);
          const unfinished = activities.filter(
            (a) =>
              a.attempt?.status !== "submitted" &&
              (!a.deadline || Date.parse(a.deadline) > serverNow),
          );
          const next =
            unfinished.find((a) => a.attempt?.status === "in_progress") ||
            unfinished[0];
          const deadlines = unfinished
            .filter((a) => a.deadline)
            .map((a) => a.deadline)
            .sort();
          return {
            ...c,
            topicCount: activities.length,
            completedCount: activities.filter(
              (a) => a.attempt?.status === "submitted",
            ).length,
            inProgressCount: activities.filter(
              (a) => a.attempt?.status === "in_progress",
            ).length,
            openApplicationCount: activities.filter((a) => a.applicationEnabled)
              .length,
            nextDeadline: deadlines[0] || null,
            nextWarmup: next
              ? {
                  id: next.id,
                  topicName: next.topic.name,
                  started: next.attempt?.status === "in_progress",
                }
              : null,
          };
        }),
      );
    return Promise.all(
      sorted.map(async (c) => {
        const view = await this.detail(user, c.id);
        return {
          ...c,
          studentCount: view.members.length,
          topicCount: view.activities.length,
          publishedCount: view.activities.filter((a) => a.published).length,
          draftCount: view.activities.filter((a) => !a.published).length,
          submittedCount: view.activities.reduce(
            (n, a) => n + a.submittedCount,
            0,
          ),
          activities: view.activities,
        };
      }),
    );
  }
  async create(user, name) {
    const id = randomUUID();
    for (let tries = 0; tries < 20; tries++) {
      const code = this.code();
      const c = {
        id,
        name,
        code,
        teacherId: user.uid,
        teacherName: user.name || "Giáo viên",
        createdAt: this.iso(),
      };
      const made = await this.repository.transaction(async (tx) => {
        if (await tx.get(`classCodes/${code}`)) return false;
        tx.set(`classCodes/${code}`, { classId: id });
        tx.set(classPath(id), c);
        return true;
      });
      if (made) return safeClass(c);
    }
    fail(503, "Chưa tạo được mã lớp. Thầy cô thử lại nhé.");
  }
  async join(user, code, fullName) {
    return this.repository.transaction(async (tx) => {
      const lookup = await tx.get(`classCodes/${code}`);
      if (!lookup)
        fail(404, "Mã lớp chưa đúng. Bạn kiểm tra lại 5 chữ số nhé.");
      const c = await tx.get(classPath(lookup.classId));
      if (!c) fail(404, "Lớp học này không còn tồn tại.");
      const path = `${classPath(c.id)}/members/${user.uid}`;
      const member = await tx.get(path);
      if (!member) {
        tx.set(path, { uid: user.uid, fullName, joinedAt: this.iso() });
        tx.set(`classMemberships/${user.uid}/classes/${c.id}`, {
          classId: c.id,
        });
      }
      return safeClass(c);
    });
  }
  finish(a, attempt, auto = false) {
    return {
      ...attempt,
      status: "submitted",
      submittedAt: new Date(
        Math.min(this.now(), Date.parse(attempt.expiresAt)),
      ).toISOString(),
      autoSubmitted: auto,
      result: gradeWarmup(a.questions, attempt.answers),
    };
  }
  applyDeadline(activity, attempt) {
    if (
      attempt?.status === "in_progress" &&
      activity.deadline &&
      Date.parse(activity.deadline) < Date.parse(attempt.expiresAt)
    )
      return { ...attempt, expiresAt: activity.deadline };
    return attempt;
  }
  async expire(id, activity, uid) {
    return this.repository.transaction(async (tx) => {
      const path = attemptPath(id, activity.id, uid);
      const previous = await tx.get(path);
      let attempt = this.applyDeadline(activity, previous);
      if (
        attempt?.status === "in_progress" &&
        this.now() >= Date.parse(attempt.expiresAt)
      ) {
        attempt = this.finish(activity, attempt, true);
        tx.set(path, attempt);
      } else if (attempt && attempt !== previous) {
        tx.set(path, attempt);
      }
      return attempt;
    });
  }
  async detail(user, id) {
    const { classroom, owns, member } = await this.access(user, id);
    const activities = (
      await this.repository.list(`${classPath(id)}/activities`)
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (owns) {
      const members = await this.repository.list(`${classPath(id)}/members`);
      const full = await Promise.all(
        activities.map(async (a) => {
          const attempts = await this.repository.list(
            `${activityPath(id, a.id)}/attempts`,
          );
          const results = await Promise.all(
            attempts.map((t) =>
              t.status === "in_progress" ? this.expire(id, a, t.uid) : t,
            ),
          );
          return {
            ...safeActivity(a),
            submittedCount: results.filter((t) => t.status === "submitted")
              .length,
            startedCount: results.length,
          };
        }),
      );
      return {
        classroom: safeClass(classroom),
        members: members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
        activities: full,
        owns: true,
        serverNow: this.now(),
      };
    }
    const full = await Promise.all(
      activities
        .filter((a) => a.published)
        .map(async (a) => ({
          ...safeActivity(a),
          attempt: safeAttempt(await this.expire(id, a, user.uid)),
        })),
    );
    return {
      classroom: safeClass(classroom),
      member,
      activities: full,
      owns: false,
      serverNow: this.now(),
    };
  }
  async createActivity(user, id, topic, deadline) {
    await this.access(user, id, true);
    const path = activityPath(id, topic.id);
    if (await this.repository.get(path))
      fail(
        409,
        "Chủ đề đã có khởi động trong lớp. Thầy cô mở chủ đề đó để quản lý.",
      );
    const questions = await this.quiz(topic);
    const activity = {
      id: topic.id,
      topic,
      title: `Khởi động · ${topic.name}`,
      questions,
      deadline,
      published: false,
      applicationEnabled: false,
      createdAt: this.iso(),
    };
    await this.repository.transaction(async (tx) => {
      if (await tx.get(path))
        fail(409, "Chủ đề vừa được tạo. Thầy cô tải lại lớp nhé.");
      tx.set(path, activity);
    });
    return activity;
  }
  async activity(user, id, activityId) {
    const { owns } = await this.access(user, id);
    const a = await this.repository.get(activityPath(id, activityId));
    if (!a || (!owns && !a.published))
      fail(404, "Chủ đề chưa được giao trong lớp.");
    if (!owns)
      return {
        ...safeActivity(a),
        attempt: safeAttempt(await this.expire(id, a, user.uid)),
        serverNow: this.now(),
      };
    const { members, classroom } = await this.detail(user, id);
    const attempts = await this.repository.list(
      `${activityPath(id, activityId)}/attempts`,
    );
    const results = members.map((m) => {
      const t = attempts.find((at) => at.uid === m.uid);
      return {
        ...m,
        status: t?.status || "not_started",
        score: t?.result?.score ?? null,
        result: t?.result || null,
        submittedAt: t?.submittedAt || null,
      };
    });
    const plan = a.planId
      ? await this.repository.get(
          `${activityPath(id, activityId)}/plans/${a.planId}`,
        )
      : null;
    const groups = plan
      ? (
          await this.repository.list(
            `${activityPath(id, activityId)}/plans/${plan.id}/groups`,
          )
        ).sort((x, y) => x.number - y.number)
      : [];
    return { ...a, classroom, results, plan, groups, serverNow: this.now() };
  }
  async updateActivity(user, id, activityId, changes) {
    await this.access(user, id, true);
    const path = activityPath(id, activityId);
    const existingAttempts = changes.deadline
      ? await this.repository.list(`${path}/attempts`)
      : [];
    await this.repository.transaction(async (tx) => {
      const a = await tx.get(path);
      const attempts = await Promise.all(
        existingAttempts.map((t) => tx.get(attemptPath(id, activityId, t.uid))),
      );
      if (!a) fail(404, "Không tìm thấy chủ đề của lớp.");
      if (
        changes.published &&
        (changes.deadline ?? a.deadline) &&
        Date.parse(changes.deadline ?? a.deadline) <= this.now()
      )
        fail(
          409,
          "Hạn khởi động đã qua. Thầy cô sửa hạn trước khi giao bài nhé.",
        );
      if (changes.questions && a.published)
        fail(409, "Bài đã giao nên không thể đổi câu hỏi hoặc đáp án.");
      if (
        changes.applicationEnabled === true &&
        !(a.published || changes.published)
      )
        fail(409, "Cần giao bài khởi động trước khi mở vận dụng.");
      tx.set(path, { ...a, ...changes });
      for (const t of attempts) {
        if (
          t?.status === "in_progress" &&
          Date.parse(changes.deadline) < Date.parse(t.expiresAt)
        )
          tx.set(attemptPath(id, activityId, t.uid), {
            ...t,
            expiresAt: changes.deadline,
          });
      }
    });
    return this.activity(user, id, activityId);
  }
  async attempt(user, id, activityId, action, input = {}) {
    await this.access(user, id);
    const payload = await this.repository.transaction(async (tx) => {
      const a = await tx.get(activityPath(id, activityId));
      const path = attemptPath(id, activityId, user.uid);
      let t = await tx.get(path);
      if (!a?.published) fail(404, "Khởi động chưa được giao.");
      const adjusted = this.applyDeadline(a, t);
      if (adjusted !== t) {
        t = adjusted;
        tx.set(path, t);
      }
      if (!t) {
        if (action !== "start") fail(404, "Bạn chưa bắt đầu khởi động.");
        if (a.deadline && this.now() >= Date.parse(a.deadline))
          fail(410, "Đã hết hạn khởi động. Bạn hỏi thầy cô nhé.");
        t = {
          uid: user.uid,
          status: "in_progress",
          answers: a.questions.map(() => null),
          startedAt: this.iso(),
          expiresAt: new Date(
            Math.min(
              this.now() + WARMUP_SECONDS * 1000,
              a.deadline ? Date.parse(a.deadline) : Infinity,
            ),
          ).toISOString(),
          revision: 0,
        };
        tx.set(path, t);
      } else if (
        t.status === "in_progress" &&
        this.now() >= Date.parse(t.expiresAt)
      ) {
        t = this.finish(a, t, true);
        tx.set(path, t);
      } else if (
        t.status === "in_progress" &&
        ["save", "submit"].includes(action)
      ) {
        if (input.answers.length !== a.questions.length)
          fail(400, "Số câu trả lời chưa hợp lệ.");
        if (action === "save" && input.revision <= t.revision)
          return {
            activity: safeActivity(a),
            attempt: safeAttempt(t),
            questions: a.questions.map(questionView),
            serverNow: this.now(),
          };
        if (action === "submit" || input.revision > t.revision)
          t = {
            ...t,
            answers: input.answers,
            revision: Math.max(t.revision, input.revision),
          };
        if (action === "submit") t = this.finish(a, t);
        tx.set(path, t);
      }
      return {
        activity: safeActivity(a),
        attempt: safeAttempt(t),
        questions: a.questions.map(questionView),
        serverNow: this.now(),
      };
    });
    return payload;
  }
  async makePlan(user, id, activityId, rebuild = false) {
    await this.access(user, id, true);
    const view = await this.activity(user, id, activityId);
    if (!view.published) fail(409, "Cần giao khởi động trước khi chia nhóm.");
    if (view.plan && !rebuild) return view;
    if (
      rebuild &&
      view.groups.some(
        (g) =>
          g.status === "generating" && this.now() < Date.parse(g.leaseUntil),
      )
    )
      fail(
        409,
        "Phiếu đang được tạo. Thầy cô đợi hoàn tất trước khi chia lại nhóm.",
      );
    const participants = view.results
      .filter((r) => r.status === "submitted")
      .map(({ uid, fullName, joinedAt, score, result }) => ({
        uid,
        fullName,
        joinedAt,
        score,
        skills: result.skills,
      }));
    if (!participants.length)
      fail(409, "Chưa có học sinh nộp khởi động để chia nhóm.");
    const groups = groupStudents(participants);
    const plan = {
      id: randomUUID(),
      createdAt: this.iso(),
      participantCount: participants.length,
      memberCount: view.results.length,
    };
    await this.repository.transaction(async (tx) => {
      const a = await tx.get(activityPath(id, activityId));
      if ((a.planId || null) !== (view.plan?.id || null))
        fail(409, "Danh sách nhóm vừa thay đổi. Thầy cô tải lại nhé.");
      tx.set(activityPath(id, activityId), { ...a, planId: plan.id });
      tx.set(`${activityPath(id, activityId)}/plans/${plan.id}`, plan);
      for (const group of groups)
        tx.set(
          `${activityPath(id, activityId)}/plans/${plan.id}/groups/${group.id}`,
          group,
        );
    });
    return this.activity(user, id, activityId);
  }
  async generateGroup(user, id, activityId, planId, groupId) {
    await this.access(user, id, true);
    const path = `${activityPath(id, activityId)}/plans/${planId}/groups/${groupId}`;
    const token = randomUUID();
    const acquired = await this.repository.transaction(async (tx) => {
      const a = await tx.get(activityPath(id, activityId));
      const g = await tx.get(path);
      if (!g || a?.planId !== planId)
        fail(409, "Nhóm đã thay đổi. Thầy cô tải lại danh sách.");
      if (g.status === "ready") return { a, g, ready: true };
      if (g.status === "generating" && this.now() < Date.parse(g.leaseUntil))
        fail(409, "Nhóm này đang tạo phiếu. Thầy cô đợi một chút nhé.");
      tx.set(path, {
        ...g,
        status: "generating",
        token,
        leaseUntil: new Date(this.now() + 115000).toISOString(),
        error: null,
      });
      return { a, g };
    });
    if (acquired.ready) return acquired.g;
    try {
      const { a, g } = acquired;
      const weak = Object.keys(skillNames)
        .filter(
          (skill) =>
            g.members.reduce((n, m) => n + (m.skills[skill]?.correct || 0), 0) /
              Math.max(
                1,
                g.members.reduce(
                  (n, m) => n + (m.skills[skill]?.total || 0),
                  0,
                ),
              ) <
            0.6,
        )
        .map((k) => skillNames[k]);
      const topic = {
        ...a.topic,
        promptGuidance: `${a.topic.promptGuidance}\nNhóm có điểm trung bình khởi động ${g.averageScore}/10. Cần củng cố: ${weak.join(", ") || "vận dụng linh hoạt"}. Không đưa điểm hoặc tên học sinh vào bài toán.`,
      };
      const exercises = await Promise.all(
        [1, 2].map((n) =>
          this.exercise(
            {
              ...topic,
              promptGuidance: `${topic.promptGuidance}\nĐây là bài số ${n} trong phiếu hai bài. Bài ${n === 1 ? "1 củng cố kỹ năng, bối cảnh gần gũi" : "2 vận dụng vào một tình huống thực tế khác"}.`,
            },
            g.difficulty,
          ),
        ),
      );
      if (exercises[0].problem.trim() === exercises[1].problem.trim())
        fail(
          502,
          "Hai bài vừa tạo bị trùng. Thầy cô thử tạo lại nhóm này nhé.",
        );
      return await this.repository.transaction(async (tx) => {
        const current = await tx.get(path);
        if (current.token !== token)
          fail(409, "Lượt tạo này đã được thay thế. Thầy cô tải lại nhé.");
        const result = {
          ...g,
          status: "ready",
          exercises: exercises.map((e, i) => ({
            number: i + 1,
            problem: e.problem,
          })),
          generatedAt: this.iso(),
        };
        tx.set(path, result);
        return result;
      });
    } catch (error) {
      await this.repository.transaction(async (tx) => {
        const current = await tx.get(path);
        if (current?.token === token)
          tx.set(path, {
            ...current,
            status: "error",
            error:
              "Chưa tạo được phiếu. Thầy cô có thể thử lại riêng nhóm này.",
          });
      });
      throw error;
    }
  }
  async application(user, id, activityId) {
    await this.access(user, id);
    const a = await this.repository.get(activityPath(id, activityId));
    if (!a?.published || !a.applicationEnabled)
      fail(403, "Thầy cô chưa mở phần vận dụng cho lớp này.");
    const t = await this.expire(id, a, user.uid);
    return {
      topicId: a.topic.id,
      difficulty:
        t?.result?.score >= 8
          ? "hard"
          : t?.result?.score >= 5
            ? "medium"
            : "easy",
    };
  }
  async worksheet(user, id, activityId, groupId) {
    const view = await this.activity(user, id, activityId);
    if (!view.groups)
      fail(403, "Phiếu luyện tập chỉ dành cho giáo viên của lớp.");
    const groups = groupId
      ? view.groups.filter((g) => g.id === groupId)
      : view.groups;
    if (!groups.length || groups.some((g) => g.status !== "ready"))
      fail(
        409,
        "Thầy cô cần tạo xong đề cho các nhóm đã chọn trước khi xuất PDF.",
      );
    return {
      classroom: (await this.access(user, id, true)).classroom,
      activity: view,
      groups,
    };
  }
}
export const classrooms = new ClassroomService();
