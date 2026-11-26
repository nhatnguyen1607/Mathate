import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { seedTopics, awardedXP } from "../../shared/catalog.js";
import { withAchievements } from "../../shared/achievements.js";
import { rewardProfile } from "./rewards.js";
export { rewardProfile } from "./rewards.js";
export const persistenceReady = !!(
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_CLOUD_PROJECT
);
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || "mathate-8cd62",
  ...(persistenceReady
    ? {
        credential: process.env.FIREBASE_SERVICE_ACCOUNT
          ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
          : applicationDefault(),
      }
    : {}),
});
export const auth = getAuth(app);
export const db = getFirestore(app);
const topics = new Map(seedTopics.map((t) => [t.id, structuredClone(t)]));
const sessions = new Map();
const profiles = new Map();
const emptyProfile = () => ({
  xp: 0,
  solved: 0,
  streak: 0,
  bestStreak: 0,
  studyDayCount: 0,
  lastStudyDate: null,
  studiedDates: [],
  topicStats: {},
  badges: [],
});
function checkStore(demo) {
  if (!demo && !persistenceReady)
    throw Object.assign(
      new Error(
        "Máy chủ chưa có thông tin Firebase Admin của Mathate. Bạn có thể chơi thử trong lúc chờ cấu hình.",
      ),
      { status: 503 },
    );
}
export const store = {
  async topics(demo, admin = false) {
    checkStore(demo);
    const list = demo
      ? [...topics.values()]
      : (await db.collection("topics").get()).docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
    return list
      .filter((t) => admin || t.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  async topic(id, demo) {
    checkStore(demo);
    return demo
      ? structuredClone(topics.get(id))
      : (await db.doc(`topics/${id}`).get()).data();
  },
  async saveTopic(id, value) {
    checkStore(false);
    await db
      .doc(`topics/${id}`)
      .set(
        { ...value, id, updatedAt: new Date().toISOString() },
        { merge: true },
      );
  },
  async deleteTopic(id) {
    checkStore(false);
    await db.doc(`topics/${id}`).delete();
  },
  async seed() {
    checkStore(false);
    const batch = db.batch();
    for (const t of seedTopics) {
      const ref = db.doc(`topics/${t.id}`);
      if (!(await ref.get()).exists) batch.set(ref, t);
    }
    await batch.commit();
  },
  async profile(uid, demo) {
    checkStore(demo);
    if (demo)
      return withAchievements(
        structuredClone(profiles.get(uid) || emptyProfile()),
      );
    const d = await db.doc(`users/${uid}`).get();
    return withAchievements({ ...emptyProfile(), ...d.data() });
  },
  async updateProfile(uid, demo, changes) {
    checkStore(demo);
    if (demo)
      profiles.set(uid, {
        ...(profiles.get(uid) || emptyProfile()),
        ...changes,
      });
    else await db.doc(`users/${uid}`).set(changes, { merge: true });
    return this.profile(uid, demo);
  },
  async history(uid, demo) {
    checkStore(demo);
    const list = demo
      ? [...sessions.values()].filter((s) => s.uid === uid)
      : (
          await db
            .collection("sessions")
            .where("uid", "==", uid)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get()
        ).docs.map((d) => d.data());
    return list
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => ({
        id: s.id,
        title: s.title,
        topic: {
          id: s.topic.id,
          name: s.topic.name,
          icon: s.topic.icon,
          color: s.topic.color,
        },
        difficulty: s.difficulty,
        createdAt: s.createdAt,
        completedAt: s.completedAt || null,
        completed: s.completed,
        xp: s.xp || 0,
        step: s.step,
      }));
  },
  async getSession(id, demo) {
    checkStore(demo);
    return demo
      ? structuredClone(sessions.get(id))
      : (await db.doc(`sessions/${id}`).get()).data();
  },
  async saveSession(session, demo) {
    checkStore(demo);
    if (demo) sessions.set(session.id, structuredClone(session));
    else
      await db.doc(`sessions/${session.id}`).set({
        ...session,
        expiresAt: Timestamp.fromMillis(Date.now() + 180 * 86400000),
      });
  },
  async complete(session, demo) {
    checkStore(demo);
    if (demo) {
      const existing = sessions.get(session.id);
      if (existing?.rewarded) return existing;
      const profile = rewardProfile(
        profiles.get(session.uid) || emptyProfile(),
        session,
      );
      profiles.set(session.uid, profile);
      const completed = {
        ...session,
        completed: true,
        rewarded: true,
        xp: awardedXP(session.difficulty, session.hints),
        completedAt: new Date().toISOString(),
      };
      sessions.set(session.id, structuredClone(completed));
      return completed;
    }
    return db.runTransaction(async (tx) => {
      const sessionRef = db.doc(`sessions/${session.id}`),
        profileRef = db.doc(`users/${session.uid}`);
      const [s, p] = await tx.getAll(sessionRef, profileRef);
      if (s.data()?.rewarded) return s.data();
      const profile = rewardProfile(
        { ...emptyProfile(), ...p.data() },
        session,
      );
      const completed = {
        ...session,
        completed: true,
        rewarded: true,
        xp: awardedXP(session.difficulty, session.hints),
        completedAt: new Date().toISOString(),
      };
      tx.set(sessionRef, completed, { merge: true });
      tx.set(profileRef, profile, { merge: true });
      return completed;
    });
  },
};
