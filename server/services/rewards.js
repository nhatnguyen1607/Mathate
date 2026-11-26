import { awardedXP } from "../../shared/catalog.js";
import {
  studyDate,
  studyDates,
  withAchievements,
} from "../../shared/achievements.js";

export function rewardProfile(profile, session, now = Date.now()) {
  const current = withAchievements(profile, now);
  const today = studyDate(now),
    yesterday = studyDate(now - 86400000);
  const sameDay = profile.lastStudyDate === today;
  const dates = studyDates(profile);
  const streak = sameDay
    ? Math.max(1, current.streak)
    : profile.lastStudyDate === yesterday
      ? current.streak + 1
      : 1;
  return withAchievements(
    {
      ...current,
      xp: (current.xp || 0) + awardedXP(session.difficulty, session.hints),
      solved: (current.solved || 0) + 1,
      topicStats: {
        ...current.topicStats,
        [session.topic.id]: (current.topicStats?.[session.topic.id] || 0) + 1,
      },
      streak,
      bestStreak: Math.max(current.bestStreak, streak),
      studyDayCount:
        current.studyDayCount + (sameDay || dates.includes(today) ? 0 : 1),
      lastStudyDate: today,
      studiedDates: [...new Set([...dates, today])].sort().slice(-90),
    },
    now,
  );
}
