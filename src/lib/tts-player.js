import { speechChunks, vietnameseVoices } from "../../shared/speech.js";

// Retains Math-AI's Cloud TTS -> base64 -> MP3 flow, gender-aware caching and stop.
// No speechSynthesis fallback: an English device voice must never read Vietnamese.
export function createTTSPlayer({
  request,
  environment = globalThis,
  maxCache = 20,
}) {
  const cache = new Map();
  let version = 0,
    currentAudio = null,
    objectUrl = null,
    controller = null;
  function releaseAudio() {
    if (currentAudio) {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio = null;
    }
    if (objectUrl) {
      environment.URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }
  function stop() {
    version++;
    controller?.abort();
    controller = null;
    releaseAudio();
  }
  async function speak(
    text,
    {
      voiceGender = "FEMALE",
      onStart = () => {},
      onEnd = () => {},
      onError = () => {},
    } = {},
  ) {
    stop();
    const ownVersion = version;
    if (!Object.hasOwn(vietnameseVoices, voiceGender))
      throw new Error("Giọng đọc không hợp lệ.");
    const chunks = speechChunks(text);
    if (!chunks.length) throw new Error("Chưa có nội dung để đọc.");
    controller = new AbortController();
    async function playChunk(index) {
      if (ownVersion !== version) return;
      if (index >= chunks.length) {
        releaseAudio();
        onEnd();
        return;
      }
      const key = JSON.stringify([voiceGender, chunks[index]]);
      let audioContent = cache.get(key);
      if (!audioContent) {
        const data = await request(
          { text: chunks[index], voiceGender },
          controller.signal,
        );
        if (ownVersion !== version) return;
        if (!data.success || !data.audioContent)
          throw new Error(
            "Chưa nhận được âm thanh tiếng Việt. Bạn thử lại nhé.",
          );
        if (data.languageCode && data.languageCode !== "vi-VN")
          throw new Error(
            "Giọng đọc chưa đúng tiếng Việt. Bạn kiểm tra cấu hình máy chủ nhé.",
          );
        audioContent = data.audioContent;
        if (cache.size >= maxCache) cache.delete(cache.keys().next().value);
        cache.set(key, audioContent);
      } else {
        cache.delete(key);
        cache.set(key, audioContent);
      }
      if (ownVersion !== version) return;
      releaseAudio();
      const bytes = Uint8Array.from(environment.atob(audioContent), (c) =>
        c.charCodeAt(0),
      );
      objectUrl = environment.URL.createObjectURL(
        new environment.Blob([bytes], { type: "audio/mpeg" }),
      );
      currentAudio = new environment.Audio(objectUrl);
      currentAudio.onended = () => {
        playChunk(index + 1).catch(fail);
      };
      currentAudio.onerror = () =>
        fail(new Error("Không phát được âm thanh. Bạn nhấn nghe lại nhé."));
      await currentAudio.play();
      if (ownVersion === version) onStart();
    }
    function fail(error) {
      if (ownVersion !== version || error.name === "AbortError") return;
      stop();
      onError(error);
    }
    try {
      await playChunk(0);
    } catch (error) {
      if (ownVersion !== version || error.name === "AbortError") return;
      stop();
      throw error;
    }
  }
  return {
    speak,
    stop,
    dispose() {
      stop();
      cache.clear();
    },
  };
}
