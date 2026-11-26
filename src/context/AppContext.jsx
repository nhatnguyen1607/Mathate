import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { onIdTokenChanged, signOut, getIdTokenResult } from "firebase/auth";
import { auth } from "../lib/firebase";
import { api, startDemo, demoId, endDemo } from "../lib/api";
import { seedTopics } from "../../shared/catalog";
import { AppearanceProvider } from "./AppearanceContext";
import { accountRole } from "../../shared/roles";
const Context = createContext(null);
const emptyProfile = {
  xp: 0,
  solved: 0,
  streak: 0,
  bestStreak: 0,
  studyDayCount: 0,
  topicStats: {},
  badges: [],
  studiedDates: [],
};
export function AppProvider({ children }) {
  const [user, setUser] = useState(null),
    [demo, setDemo] = useState(!!demoId()),
    [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(emptyProfile),
    [topics, setTopics] = useState(seedTopics),
    [history, setHistory] = useState([]);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [health, setHealth] = useState(null);
  const generation = useRef(0);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);
  useEffect(() => {
    let revision = 0,
      active = true,
      previousUid;
    const unsubscribe = onIdTokenChanged(auth, async (value) => {
      const currentRevision = ++revision;
      if (previousUid !== value?.uid) {
        ++generation.current;
        setProfile(emptyProfile);
        setHistory([]);
        previousUid = value?.uid;
      }
      if (value) {
        const result = await getIdTokenResult(value).catch(() => ({
          claims: {},
        }));
        if (
          !active ||
          revision !== currentRevision ||
          auth.currentUser !== value
        )
          return;
        const nextRole = accountRole(result.claims);
        setUser((old) =>
          old?.uid === value.uid && old.role === nextRole
            ? old
            : {
                uid: value.uid,
                get displayName() {
                  return value.displayName;
                },
                admin: result.claims.admin === true,
                role: nextRole,
              },
        );
        setDemo(false);
        endDemo();
      } else if (active) setUser(null);
      if (!active) return;
      setReady(true);
    });
    return () => {
      active = false;
      ++revision;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const updateRole = async () => {
      const current = auth.currentUser;
      if (!current) return;
      try {
        const token = await getIdTokenResult(current, true);
        const role = accountRole(token.claims);
        setUser((old) =>
          old?.uid === current.uid && old.role !== role
            ? { ...old, role, admin: role === "admin" }
            : old,
        );
      } catch {
        /* The next API call reports an expired sign-in. */
      }
    };
    window.addEventListener("focus", updateRole);
    return () => window.removeEventListener("focus", updateRole);
  }, []);
  const refresh = useCallback(async () => {
    const currentGeneration = ++generation.current;
    if (!user && !demo) {
      setProfile(emptyProfile);
      setHistory([]);
      setTopics(seedTopics);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [p, t, h] = await Promise.allSettled([
        api("/profile"),
        api("/topics"),
        user?.admin || user?.role === "teacher"
          ? Promise.resolve([])
          : api("/history"),
      ]);
      if (currentGeneration !== generation.current) return;
      if (p.status === "fulfilled") setProfile(p.value);
      if (t.status === "fulfilled") setTopics(t.value);
      if (h.status === "fulfilled") setHistory(h.value);
      setError(
        [p, t, h]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason.message)
          .join(" "),
      );
    } catch (e) {
      if (currentGeneration === generation.current) setError(e.message);
    } finally {
      if (currentGeneration === generation.current) setLoading(false);
    }
  }, [user, demo]);
  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);
  const enterDemo = () => {
    startDemo();
    setDemo(true);
  };
  const logout = async () => {
    await signOut(auth);
    endDemo();
    setDemo(false);
    setUser(null);
  };
  const saveProfile = async (changes) => {
    const result = await api("/profile", { method: "PATCH", body: changes });
    setProfile(result);
    return result;
  };
  const acceptProfile = (result) => setProfile(result);
  return (
    <AppearanceProvider profile={profile}>
      <Context.Provider
        value={{
          user,
          demo,
          ready,
          profile,
          topics,
          history,
          refresh,
          error,
          loading,
          health,
          enterDemo,
          logout,
          saveProfile,
          acceptProfile,
        }}
      >
        {children}
      </Context.Provider>
    </AppearanceProvider>
  );
}
export const useApp = () => useContext(Context);
