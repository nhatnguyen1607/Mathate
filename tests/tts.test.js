import test from "node:test";
import assert from "node:assert/strict";
import {
  synthesizeSpeech,
  ttsAuthOptions,
  ttsConfigured,
} from "../server/services/tts.js";
import { createTTSPlayer } from "../src/lib/tts-player.js";
import { speechChunks } from "../shared/speech.js";

test("Cloud TTS preserves Math-AI Vietnamese male/female voices and MP3 settings", async () => {
  const requests = [];
  const client = {
    request: async (value) => {
      requests.push(value);
      return { data: { audioContent: "YXVkaW8=" } };
    },
  };
  for (const gender of ["FEMALE", "MALE"]) {
    const result = await synthesizeSpeech("Mimo chào bạn nhỏ!", gender, {
      client,
    });
    assert.equal(result.languageCode, "vi-VN");
    assert.equal(result.success, true);
  }
  assert.deepEqual(
    requests.map((r) => r.data.voice),
    [
      { languageCode: "vi-VN", name: "vi-VN-Wavenet-A", ssmlGender: "FEMALE" },
      { languageCode: "vi-VN", name: "vi-VN-Wavenet-B", ssmlGender: "MALE" },
    ],
  );
  assert.deepEqual(requests[0].data.audioConfig, {
    audioEncoding: "MP3",
    speakingRate: 1.0,
    pitch: 0,
  });
});
test("TTS configuration is separate from Firebase and supports Math-AI environment formats", () => {
  assert.equal(ttsConfigured({}), false);
  assert.equal(
    ttsAuthOptions({ TTS_APPLICATION_CREDENTIALS: "C:/secure/voice.json" })
      .keyFilename,
    "C:/secure/voice.json",
  );
  const options = ttsAuthOptions({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "tts@example.invalid",
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "line1\\nline2",
    GCP_PROJECT_ID: "voice-project",
  });
  assert.equal(options.credentials.private_key, "line1\nline2");
  assert.equal(options.credentials.project_id, "voice-project");
});
function fakeEnvironment() {
  const instances = [],
    revoked = [];
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.paused = false;
      instances.push(this);
    }
    async play() {
      this.played = true;
    }
    pause() {
      this.paused = true;
    }
  }
  return {
    instances,
    revoked,
    environment: {
      Audio: FakeAudio,
      Blob,
      atob,
      URL: {
        createObjectURL: () => `blob:test-${instances.length}`,
        revokeObjectURL: (value) => revoked.push(value),
      },
      speechSynthesis: {
        speak: () => {
          throw new Error("English fallback must never be invoked");
        },
      },
    },
  };
}
test("Playback caches by gender, releases audio and never invokes browser voices", async () => {
  const env = fakeEnvironment(),
    requests = [];
  const player = createTTSPlayer({
    environment: env.environment,
    request: async (body) => {
      requests.push(body);
      return { success: true, languageCode: "vi-VN", audioContent: "YXVkaW8=" };
    },
  });
  await player.speak("Chào bạn.", { voiceGender: "FEMALE" });
  await player.speak("Chào bạn.", { voiceGender: "FEMALE" });
  await player.speak("Chào bạn.", { voiceGender: "MALE" });
  assert.deepEqual(
    requests.map((r) => r.voiceGender),
    ["FEMALE", "MALE"],
  );
  assert.equal(env.instances[0].paused, true);
  player.stop();
  assert.equal(env.revoked.length, 3);
  player.dispose();
});
test("Stopped or replaced TTS requests cannot start late audio", async () => {
  const env = fakeEnvironment();
  let finish;
  const player = createTTSPlayer({
    environment: env.environment,
    request: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = player.speak("Mimo chào bạn.");
  player.stop();
  finish({ success: true, audioContent: "YXVkaW8=" });
  await pending;
  assert.equal(env.instances.length, 0);
});
test("Provider failure stays an error instead of falling back to an English voice", async () => {
  const env = fakeEnvironment();
  const player = createTTSPlayer({
    environment: env.environment,
    request: async () => {
      throw new Error("Cloud TTS unavailable");
    },
  });
  await assert.rejects(player.speak("Xin chào bạn."), /Cloud TTS unavailable/);
  assert.equal(env.instances.length, 0);
});
test("Long Vietnamese text is split by UTF-8 bytes without losing words", () => {
  const text = "Mimo cùng bạn giải bài toán, kiểm tra kết quả và đơn vị. "
    .repeat(150)
    .trim();
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.join(" "), text);
  assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk, "utf8") <= 4200));
});
