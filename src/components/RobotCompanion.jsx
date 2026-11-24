import React, { useEffect, useState } from "react";
import { Heart, Lightbulb, Sparkles, Volume2, Hand } from "lucide-react";
import { Mascot } from "./ui";
import { useCompanion } from "../context/AppearanceContext";
const moods = {
  idle: { label: "Mimo sẵn sàng học cùng bạn", Icon: Sparkles },
  thinking: { label: "Mimo đang suy nghĩ cùng bạn", Icon: Lightbulb },
  correct: { label: "Mimo vui vì bạn đã làm được", Icon: Sparkles },
  wrong: { label: "Mimo động viên bạn thử lại", Icon: Heart },
  speaking: { label: "Mimo đang đọc bằng tiếng Việt", Icon: Volume2 },
};
export default function RobotCompanion({
  status = "idle",
  isSpeaking = false,
}) {
  const { copy } = useCompanion();
  const [greeting, setGreeting] = useState(0);
  const mood = isSpeaking
    ? "speaking"
    : Object.hasOwn(moods, status)
      ? status
      : "idle";
  const { label, Icon } = moods[mood];
  useEffect(() => {
    if (!greeting) return;
    const timeout = setTimeout(() => setGreeting(0), 1500);
    return () => clearTimeout(timeout);
  }, [greeting]);
  return (
    <div className={`mimo-companion ${mood}`}>
      <div
        className={`companion-render mimo-stage ${mood} ${greeting ? "greeting" : ""}`}
        role="img"
        aria-label={copy(greeting ? "Mimo chào bạn nhỏ" : label)}
      >
        <div className="mimo-stage-ground" />
        <Mascot
          key={greeting}
          pose={
            mood === "thinking"
              ? "thinking"
              : mood === "correct"
                ? "happy"
                : "welcome"
          }
          className="mimo-character"
          alt=""
        />
        <span className="mimo-mood-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        {isSpeaking && (
          <span className="mimo-speaking-waves" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <button
        className="text-button mimo-greet"
        type="button"
        onClick={() => setGreeting((value) => value + 1)}
        disabled={isSpeaking || mood === "thinking"}
      >
        <Hand size={16} />
        {copy(greeting ? "Mimo chào bạn!" : "Chào Mimo")}
      </button>
    </div>
  );
}
