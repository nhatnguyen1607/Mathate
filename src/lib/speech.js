import { api } from "./api";
import { createTTSPlayer } from "./tts-player.js";
const tts = createTTSPlayer({
  request: (body, signal) => api("/tts", { method: "POST", body, signal }),
});
export const stopSpeech = tts.stop;
export const speak = tts.speak;
if (import.meta.hot) import.meta.hot.dispose(() => tts.dispose());
