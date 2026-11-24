import React, { memo, useEffect, useState } from "react";
import { useTypewriter } from "../hooks/useTypewriter";
import { TYPEWRITER_SPEED_MS } from "../../shared/playback.js";

// Original Math-AI hook/tokenization and configured PracticeChat speed;
// only markup, theme classes and reduced-motion support are adapted to Mathate.
const TypewriterMessage = memo(function TypewriterMessage({
  text,
  paused,
  onComplete,
  onTextUpdate,
}) {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);
  const { displayedText, isTyping, skipToEnd } = useTypewriter(text, {
    speed: TYPEWRITER_SPEED_MS,
    enabled: !reducedMotion,
    paused,
    onComplete,
  });
  useEffect(() => {
    onTextUpdate?.();
  }, [displayedText, onTextUpdate]);
  useEffect(() => {
    if (reducedMotion) onComplete?.();
  }, [reducedMotion]);
  return (
    <div className="typewriter-message">
      <p aria-hidden="true">
        {displayedText}
        {isTyping && <span className="typewriter-caret" />}
      </p>
      <span className="sr-only">{text}</span>
      {isTyping && (
        <button type="button" className="typewriter-skip" onClick={skipToEnd}>
          Hiện toàn bộ
        </button>
      )}
    </div>
  );
});
export default TypewriterMessage;
