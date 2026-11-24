import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { onAuthStateChanged, signOut, getIdTokenResult } from "firebase/auth";
import { auth } from "../lib/firebase";
import { api, startDemo, demoId, endDemo } from "../lib/api";
import { seedTopics } from "../../shared/catalog";
import { AppearanceProvider } from "./AppearanceContext";
const Context = createContext(null);
const emptyProfile = {
  xp: 0,
  solved: 0,
  streak: 0,
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
  useEffect(
    () =>
      onAuthStateChanged(auth, async (value) => {
        setProfile(emptyProfile);
        if (value) {
          const result = await getIdTokenResult(value).catch(() => ({
            claims: {},
          }));
          setUser({
            uid: value.uid,
            get displayName() {
              return value.displayName;
            },
            admin: result.claims.admin === true,
          });
          setDemo(false);
          endDemo();
        } else setUser(null);
        setReady(true);
      }),
    [],
  );
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
        user?.admin ? Promise.resolve([]) : api("/history"),
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
