// A medal is a rule, not a UI condition. Add a metric/target here to extend the
// collection; both the server awards and the client progress use this catalog.
export const badgeGroups = [
  { id: "problems", name: "Giải toán", icon: "book" },
  { id: "habit", name: "Chăm học", icon: "flame" },
  { id: "experience", name: "Kinh nghiệm", icon: "sparkles" },
  { id: "discovery", name: "Khám phá", icon: "compass" },
];
const medal = (id, group, metric, target, name, description, icon, color) => ({
  id,
  group,
  metric,
  target,
  name,
  description,
  icon,
  color,
});
export const badges = [
  medal(
    "first-step",
    "problems",
    "solved",
    1,
    "Bước chân đầu tiên",
    "Hoàn thành bài toán đầu tiên.",
    "sprout",
    "green",
  ),
  medal(
    "five-problems",
    "problems",
    "solved",
    5,
    "Ngôi sao chăm chỉ",
    "Giải và kiểm tra 5 bài toán.",
    "star",
    "yellow",
  ),
  medal(
    "ten-problems",
    "problems",
    "solved",
    10,
    "Đôi tay khéo nghĩ",
    "Hoàn thành 10 bài toán.",
    "pencil",
    "blue",
  ),
  medal(
    "twenty-five-problems",
    "problems",
    "solved",
    25,
    "Cuốn sổ đầy ý tưởng",
    "Hoàn thành 25 bài toán.",
    "book",
    "purple",
  ),
  medal(
    "fifty-problems",
    "problems",
    "solved",
    50,
    "Nhà giải toán nhí",
    "Hoàn thành 50 bài toán.",
    "medal",
    "orange",
  ),
  medal(
    "hundred-problems",
    "problems",
    "solved",
    100,
    "Trăm lần khám phá",
    "Hoàn thành 100 bài toán.",
    "trophy",
    "yellow",
  ),
  medal(
    "streak-three",
    "habit",
    "bestStreak",
    3,
    "Ba ngày nảy mầm",
    "Học và giải bài trong 3 ngày liên tiếp.",
    "sprout",
    "green",
  ),
  medal(
    "streak-seven",
    "habit",
    "bestStreak",
    7,
    "Một tuần rực rỡ",
    "Duy trì chuỗi học 7 ngày liên tiếp.",
    "flame",
    "orange",
  ),
  medal(
    "streak-fourteen",
    "habit",
    "bestStreak",
    14,
    "Ngọn lửa bền bỉ",
    "Duy trì chuỗi học 14 ngày liên tiếp.",
    "flame",
    "pink",
  ),
  medal(
    "streak-thirty",
    "habit",
    "bestStreak",
    30,
    "Thói quen tỏa sáng",
    "Duy trì chuỗi học 30 ngày liên tiếp.",
    "sun",
    "yellow",
  ),
  medal(
    "study-seven",
    "habit",
    "studyDayCount",
    7,
    "Hẹn nhau cùng học",
    "Có 7 ngày giải toán, không cần liên tiếp.",
    "calendar",
    "blue",
  ),
  medal(
    "study-thirty",
    "habit",
    "studyDayCount",
    30,
    "Vườn học mỗi ngày",
    "Có 30 ngày giải toán, không cần liên tiếp.",
    "flower",
    "pink",
  ),
  medal(
    "study-sixty",
    "habit",
    "studyDayCount",
    60,
    "Những ngày đáng nhớ",
    "Có 60 ngày giải toán, không cần liên tiếp.",
    "calendar",
    "purple",
  ),
  medal(
    "xp-hundred",
    "experience",
    "xp",
    100,
    "Túi sao đầu tiên",
    "Tích lũy 100 XP từ những bài đã giải.",
    "sparkles",
    "yellow",
  ),
  medal(
    "xp-three-hundred",
    "experience",
    "xp",
    300,
    "Ánh sao lớn dần",
    "Tích lũy 300 XP.",
    "star",
    "purple",
  ),
  medal(
    "xp-six-fifty",
    "experience",
    "xp",
    650,
    "Đôi cánh tư duy",
    "Tích lũy 650 XP.",
    "rocket",
    "blue",
  ),
  medal(
    "xp-twelve-hundred",
    "experience",
    "xp",
    1200,
    "Chòm sao của mình",
    "Tích lũy 1.200 XP.",
    "sparkles",
    "pink",
  ),
  medal(
    "xp-twenty-five-hundred",
    "experience",
    "xp",
    2500,
    "Bầu trời ý tưởng",
    "Tích lũy 2.500 XP.",
    "trophy",
    "yellow",
  ),
  medal(
    "explorer",
    "discovery",
    "topics",
    3,
    "Trí tò mò không giới hạn",
    "Hoàn thành bài ở 3 chủ đề khác nhau.",
    "compass",
    "purple",
  ),
  medal(
    "five-topics",
    "discovery",
    "topics",
    5,
    "Bản đồ nhiều sắc màu",
    "Hoàn thành bài ở 5 chủ đề khác nhau.",
    "map",
    "blue",
  ),
  medal(
    "eight-topics",
    "discovery",
    "topics",
    8,
    "Chân trời rộng mở",
    "Hoàn thành bài ở 8 chủ đề khác nhau.",
    "compass",
    "orange",
  ),
  medal(
    "topic-five",
    "discovery",
    "topicBest",
    5,
    "Bạn thân của chủ đề",
    "Giải 5 bài trong cùng một chủ đề.",
    "heart",
    "pink",
  ),
  medal(
    "topic-fifteen",
    "discovery",
    "topicBest",
    15,
    "Rễ cây vững vàng",
    "Giải 15 bài trong cùng một chủ đề.",
    "sprout",
    "green",
  ),
  medal(
    "topic-thirty",
    "discovery",
    "topicBest",
    30,
    "Góc toán của chuyên gia",
    "Giải 30 bài trong cùng một chủ đề.",
    "medal",
    "purple",
  ),
];
const count = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
export const studyDate = (now = Date.now()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
export function studyDates(profile) {
  return [
    ...new Set(
      (profile.studiedDates || []).filter(
        (value) =>
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value)),
      ),
    ),
  ].sort();
}
function longestRun(dates) {
  let best = 0,
    run = 0,
    previous;
  for (const date of dates) {
    const day = Date.parse(date);
    run = day - previous === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
export function achievementMetrics(profile = {}) {
  const dates = studyDates(profile);
  const topics = Object.values(profile.topicStats || {})
    .map(count)
    .filter(Boolean);
  return {
    solved: count(profile.solved),
    xp: count(profile.xp),
    bestStreak: Math.max(
      count(profile.bestStreak),
      count(profile.streak),
      longestRun(dates),
    ),
    studyDayCount: Math.max(count(profile.studyDayCount), dates.length),
    topics: topics.length,
    topicBest: Math.max(0, ...topics),
  };
}
export function earnedBadgeIds(profile = {}) {
  const metrics = achievementMetrics(profile);
  return [
    ...new Set([
      ...(profile.badges || []),
      ...badges.filter((b) => metrics[b.metric] >= b.target).map((b) => b.id),
    ]),
  ];
}
export function withAchievements(profile, now = Date.now()) {
  const metrics = achievementMetrics(profile);
  const today = studyDate(now),
    yesterday = studyDate(now - 86400000);
  const result = {
    ...profile,
    bestStreak: metrics.bestStreak,
    studyDayCount: metrics.studyDayCount,
    streak:
      profile.lastStudyDate &&
      ![today, yesterday].includes(profile.lastStudyDate)
        ? 0
        : count(profile.streak),
  };
  return { ...result, badges: earnedBadgeIds(result) };
}
export function badgeProgress(badge, profile) {
  const actual = achievementMetrics(profile)[badge.metric] || 0;
  const earned =
    (profile.badges || []).includes(badge.id) || actual >= badge.target;
  // An unearned streak follows the current run, so an interrupted run cannot
  // promise fewer days than the child actually needs. Earned medals persist.
  const current =
    badge.metric === "bestStreak" ? count(profile.streak) : actual;
  const value = earned ? badge.target : Math.min(current, badge.target);
  const units = {
    solved: "bài",
    bestStreak: "ngày liên tiếp",
    studyDayCount: "ngày học",
    xp: "XP",
    topics: "chủ đề",
    topicBest: "bài cùng chủ đề",
  };
  return {
    earned,
    value,
    target: badge.target,
    remaining: Math.max(0, badge.target - value),
    unit: units[badge.metric],
    percent: Math.round((value / badge.target) * 100),
  };
}
