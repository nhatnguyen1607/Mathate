export const WARMUP_SECONDS = 7 * 60;
export const QUESTION_COUNT = 8;
export const GROUP_SIZE = 5;
export const skillNames = {
  understand: "Hiểu đề",
  plan: "Lập kế hoạch",
  calculate: "Tính toán",
  check: "Kiểm tra",
};
export function gradeWarmup(questions, answers) {
  const skills = {};
  let correct = 0;
  questions.forEach((q, i) => {
    const hit = answers[i] === q.correctIndex;
    correct += Number(hit);
    const skill = (skills[q.skill] ||= { correct: 0, total: 0 });
    skill.total++;
    skill.correct += Number(hit);
  });
  return {
    correct,
    total: questions.length,
    score: Math.round((correct / questions.length) * 1000) / 100,
    skills,
  };
}
export function groupStudents(results) {
  const ranked = [...results].sort(
    (a, b) =>
      b.score - a.score ||
      a.joinedAt.localeCompare(b.joinedAt) ||
      a.uid.localeCompare(b.uid),
  );
  const groups = [];
  for (let i = 0; i < ranked.length; i += GROUP_SIZE) {
    const members = ranked
      .slice(i, i + GROUP_SIZE)
      .map((s, j) => ({ ...s, rank: i + j + 1 }));
    const averageScore =
      Math.round(
        (members.reduce((n, s) => n + s.score, 0) / members.length) * 100,
      ) / 100;
    groups.push({
      id: `group-${groups.length + 1}`,
      number: groups.length + 1,
      members,
      averageScore,
      difficulty:
        averageScore >= 8 ? "hard" : averageScore >= 5 ? "medium" : "easy",
      status: "pending",
      exercises: [],
    });
  }
  return groups;
}
