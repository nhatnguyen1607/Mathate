import { ClassroomService } from "../../server/services/classrooms.js";
export class MemoryClassroomRepository {
  docs = new Map();
  queue = Promise.resolve();
  async get(path) {
    return structuredClone(this.docs.get(path) || null);
  }
  async list(path, filter) {
    return [...this.docs.entries()]
      .filter(
        ([key, value]) =>
          key.startsWith(path + "/") &&
          key.split("/").length === path.split("/").length + 1 &&
          (!filter || value[filter.field] === filter.value),
      )
      .map(([, value]) => structuredClone(value));
  }
  async transaction(fn) {
    const previous = this.queue;
    let release;
    this.queue = new Promise((r) => {
      release = r;
    });
    await previous;
    const writes = new Map();
    try {
      const result = await fn({
        get: async (path) => {
          if (writes.size)
            throw new Error("Firestore requires reads before writes");
          return this.get(path);
        },
        set: (path, value) => writes.set(path, structuredClone(value)),
      });
      for (const [path, value] of writes) this.docs.set(path, value);
      return result;
    } finally {
      release();
    }
  }
}
export const fixtureTeacher = {
  uid: "fixture-teacher",
  role: "teacher",
  name: "Cô Nguyễn Mai Anh",
};
export const fixtureTopic = {
  id: "fixture-numbers",
  name: "Số và phép tính",
  icon: "calculator",
  color: "green",
  promptType: "general",
  active: true,
  promptGuidance:
    "Cộng, trừ và nhân các số tự nhiên trong phạm vi 100, dành cho học sinh tiểu học.",
};
export const fixtureQuestions = Array.from({ length: 8 }, (_, i) => ({
  id: `q-${i + 1}`,
  text: `Trong giỏ có ${i + 3} quả táo. Bông thêm 2 quả nữa. Bây giờ có tất cả bao nhiêu quả táo?`,
  options: [
    `${i + 5} quả táo`,
    `${i + 4} quả táo`,
    `${i + 6} quả táo`,
    `${i + 3} quả táo`,
  ],
  correctIndex: 0,
  skill: ["understand", "plan", "calculate", "check"][Math.floor(i / 2)],
  explanation: `Cộng số táo ban đầu và số táo thêm vào: ${i + 3} + 2 = ${i + 5} (quả).`,
}));
export async function classroomFixture({
  students = 0,
  completed = 0,
  startTime = Date.now(),
} = {}) {
  const repository = new MemoryClassroomRepository();
  let clock = startTime,
    exerciseCalls = 0;
  const service = new ClassroomService({
    repository,
    now: () => clock,
    quiz: async () => structuredClone(fixtureQuestions),
    exercise: async (topic, difficulty) => ({
      problem: `Bài minh họa ${++exerciseCalls}: Nhóm bạn trồng 4 hàng hoa, mỗi hàng có ${exerciseCalls + 2} cây. Hỏi nhóm bạn trồng tất cả bao nhiêu cây?`,
      title: topic.name,
    }),
    code: () => "58316",
  });
  const classroom = await service.create(fixtureTeacher, "Vườn toán học 5A");
  await service.createActivity(
    fixtureTeacher,
    classroom.id,
    fixtureTopic,
    null,
  );
  await service.updateActivity(fixtureTeacher, classroom.id, fixtureTopic.id, {
    published: true,
  });
  const names = [
    "Nguyễn Minh An",
    "Trần Ngọc Bảo",
    "Lê Hà Chi",
    "Phạm Anh Dũng",
    "Hoàng Gia Hân",
    "Vũ Khánh Linh",
    "Đặng Bảo Minh",
    "Đỗ Nhật Nam",
    "Bùi Mai Phương",
    "Nguyễn Đức Quân",
    "Trần Minh Thư",
    "Lê Anh Tú",
    "Phạm Quỳnh Vy",
  ];
  for (let i = 0; i < students; i++) {
    const student = {
      uid: `fixture-student-${String(i + 1).padStart(2, "0")}`,
      role: "student",
      name: names[i] || `Học sinh ${i + 1}`,
    };
    await service.join(student, classroom.code, student.name);
    clock++;
    if (i < completed) {
      await service.attempt(student, classroom.id, fixtureTopic.id, "start");
      const correct = Math.max(0, 8 - Math.floor(i / 2));
      await service.attempt(student, classroom.id, fixtureTopic.id, "submit", {
        answers: fixtureQuestions.map((q, j) => (j < correct ? 0 : 1)),
        revision: 1,
      });
    }
  }
  return {
    service,
    repository,
    classroom,
    topic: fixtureTopic,
    teacher: fixtureTeacher,
    get time() {
      return clock;
    },
    advance: (milliseconds) => {
      clock += milliseconds;
    },
    get exerciseCalls() {
      return exerciseCalls;
    },
  };
}
