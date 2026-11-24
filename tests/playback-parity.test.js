import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  TYPEWRITER_SPEED_MS,
  TTS_TEXT_FALLBACK_MS,
  speechText,
} from "../shared/playback.js";
test("Typing hook is copied verbatim from Math-AI", async () => {
  const original = await readFile(
    new URL("../../Math-AI/src/hooks/useTypewriter.js", import.meta.url),
    "utf8",
  );
  const actual = await readFile(
    new URL("../src/hooks/useTypewriter.js", import.meta.url),
    "utf8",
  );
  assert.equal(actual, original);
});
test("Typing speed and speech fallback match the actual Math-AI PracticeChat configuration", async () => {
  const original = await readFile(
    new URL("../../Math-AI/src/components/PracticeChat.jsx", import.meta.url),
    "utf8",
  );
  assert.equal(
    TYPEWRITER_SPEED_MS,
    Number(original.match(/<TypewriterMessage[\s\S]*?speed=\{(\d+)\}/)?.[1]),
  );
  assert.equal(
    TTS_TEXT_FALLBACK_MS,
    Number(
      original.match(/setTimeout\(startTypewriterFallback,\s*(\d+)\)/)?.[1],
    ),
  );
  assert.equal(speechText("12 : 3 = 4"), "12 chia 3 = 4");
});
