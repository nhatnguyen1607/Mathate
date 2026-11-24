import React, { createContext, useContext, useMemo, useEffect } from "react";
import {
  companions,
  themes,
  companionAsset,
} from "../../shared/personalization.js";
const fallback = {
  character: companions[0],
  theme: "leaf",
  asset: (pose) => companionAsset("mimo", pose),
  copy: (text) => text,
};
const AppearanceContext = createContext(fallback);
export function AppearanceProvider({ profile, children }) {
  const id = companions.some((c) => c.id === profile.companion)
    ? profile.companion
    : "mimo";
  const theme = themes.some((t) => t.id === profile.theme)
    ? profile.theme
    : "leaf";
  const value = useMemo(
    () => ({
      character: companions.find((c) => c.id === id),
      theme,
      asset: (pose) => companionAsset(id, pose),
      copy: (text) =>
        typeof text === "string"
          ? text.replace(/Mimo/g, companions.find((c) => c.id === id).name)
          : text,
    }),
    [id, theme],
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
export const useCompanion = () => useContext(AppearanceContext);
