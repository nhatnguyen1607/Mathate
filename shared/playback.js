// Math-AI/src/components/PracticeChat.jsx: speed={120}, fallback timeout 2000.
export const TYPEWRITER_SPEED_MS = 120;
export const TTS_TEXT_FALLBACK_MS = 2000;
export function speechText(text) {
  return typeof text === "string"
    ? text.replace(/([0-9A-Za-z])\s*:\s*([0-9])/g, "$1 chia $2")
    : text;
}
