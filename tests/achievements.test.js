import test from "node:test";
import assert from "node:assert/strict";
import {
  badges,
  badgeGroups,
  achievementMetrics,
  badgeProgress,
  withAchievements,
  studyDate,
} from "../shared/achievements.js";
import { rewardProfile } from "../server/services/rewards.js";
const now = Date.parse("2026-11-26T12:00:00+07:00");
const session = { difficulty: "easy", hints: 0, topic: { id: "numbers" } };

test("Catalog has 24 unique, configurable medals in four groups", () => {
  assert.equal(badges.length, 24);
  assert.equal(new Set(badges.map((b) => b.id)).size, 24);
  for (const b of badges) {
    assert.ok(badgeGroups.some((g) => g.id === b.group));
    assert.ok(b.target > 0);
    assert.ok(b.metric in achievementMetrics({}));
  }
});
test("Old profiles receive eligible new awards without losing existing badges", () => {
  const profile = withAchievements(
    {
      xp: 350,
      solved: 25,
      streak: 7,
      lastStudyDate: "2026-11-25",
      topicStats: { a: 20, b: 4, c: 1, empty: 0 },
      badges: ["first-step", "legacy-custom"],
    },
    now,
  );
  for (const id of [
    "first-step",
    "five-problems",
    "ten-problems",
    "twenty-five-problems",
    "xp-hundred",
    "xp-three-hundred",
    "streak-seven",
    "explorer",
    "topic-fifteen",
    "legacy-custom",
  ])
    assert.ok(profile.badges.includes(id), id);
  assert.ok(!profile.badges.includes("five-topics"));
  assert.equal(profile.bestStreak, 7);
});
test("A completed practice awards milestone crossings from server-controlled XP", () => {
  const profile = rewardProfile(
    {
      xp: 90,
      solved: 4,
      streak: 2,
      lastStudyDate: "2026-11-25",
      topicStats: { numbers: 4 },
      studiedDates: ["2026-11-24", "2026-11-25"],
    },
    session,
    now,
  );
  assert.equal(profile.xp, 110);
  assert.equal(profile.solved, 5);
  assert.equal(profile.streak, 3);
  assert.equal(profile.studyDayCount, 3);
  for (const id of [
    "first-step",
    "five-problems",
    "xp-hundred",
    "streak-three",
    "topic-five",
  ])
    assert.ok(profile.badges.includes(id), id);
});
test("Same-day rewards do not increase study days or streak twice", () => {
  const first = rewardProfile({ xp: 0 }, session, now);
  const next = rewardProfile(first, session, now + 1000);
  assert.equal(next.solved, 2);
  assert.equal(next.xp, 40);
  assert.equal(next.studyDayCount, 1);
  assert.equal(next.streak, 1);
});
test("Interrupted streak resets current days but preserves best and earned medals", () => {
  const old = {
    xp: 200,
    solved: 10,
    streak: 7,
    lastStudyDate: "2026-11-20",
    badges: [],
    topicStats: {},
  };
  const displayed = withAchievements(old, now);
  assert.equal(displayed.streak, 0);
  assert.equal(displayed.bestStreak, 7);
  assert.ok(displayed.badges.includes("streak-seven"));
  const next = rewardProfile(displayed, session, now);
  assert.equal(next.streak, 1);
  assert.equal(next.bestStreak, 7);
  assert.ok(next.badges.includes("streak-seven"));
});
test("Historical dates backfill habit metrics; lifetime study days survive the 90-day window", () => {
  const dates = Array.from({ length: 90 }, (_, i) =>
    studyDate(now - (90 - i) * 86400000),
  );
  const next = rewardProfile(
    {
      xp: 0,
      studyDayCount: 120,
      studiedDates: dates,
      lastStudyDate: dates.at(-1),
      streak: 90,
    },
    session,
    now,
  );
  assert.equal(next.studyDayCount, 121);
  assert.equal(next.studiedDates.length, 90);
  assert.equal(next.bestStreak, 91);
  assert.ok(next.badges.includes("study-sixty"));
  assert.ok(next.badges.includes("streak-thirty"));
});
test("Progress is capped, permanent medals remain complete, zero-count topics do not count", () => {
  const b = badges.find((b) => b.id === "five-problems");
  assert.equal(badgeProgress(b, { solved: 2 }).remaining, 3);
  assert.equal(badgeProgress(b, { solved: 99 }).value, 5);
  assert.equal(badgeProgress(b, { solved: 0, badges: [b.id] }).earned, true);
  assert.equal(
    achievementMetrics({ topicStats: { a: 0, b: 1, c: -5 } }).topics,
    1,
  );
});
test("Day boundaries use the application's Vietnam/Thailand timezone", () => {
  const p = rewardProfile(
    { xp: 0, streak: 1, lastStudyDate: "2026-11-26" },
    session,
    Date.parse("2026-11-26T17:01:00Z"),
  );
  assert.equal(p.lastStudyDate, "2026-11-27");
  assert.equal(p.streak, 2);
});
test("Unfinished streak progress uses the current run and keeps completed streak medals", () => {
  const next = badges.find((b) => b.id === "streak-fourteen");
  assert.equal(badgeProgress(next, { streak: 3, bestStreak: 7 }).remaining, 11);
  const earned = badges.find((b) => b.id === "streak-seven");
  assert.equal(
    badgeProgress(earned, { streak: 0, bestStreak: 7 }).earned,
    true,
  );
});
