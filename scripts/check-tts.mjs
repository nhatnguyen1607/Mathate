import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { synthesizeSpeech } from "../server/services/tts.js";
await mkdir("tmp/tts-check", { recursive: true });
let failures = 0;
for (const gender of ["FEMALE", "MALE"]) {
  try {
    const result = await synthesizeSpeech(
      "Chào bạn, mình là Mimo. Chúng mình cùng khám phá toán học nhé!",
      gender,
    );
    const bytes = Buffer.from(result.audioContent, "base64");
    if (bytes.length < 1000) throw new Error("Âm thanh trả về quá ngắn.");
    await writeFile(`tmp/tts-check/${gender.toLowerCase()}.mp3`, bytes);
    console.log(
      JSON.stringify({
        success: true,
        language: result.languageCode,
        voice: result.voiceName,
        bytes: bytes.length,
        path: `tmp/tts-check/${gender.toLowerCase()}.mp3`,
      }),
    );
  } catch (error) {
    failures++;
    console.error(`TTS ${gender}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
