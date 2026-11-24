import "dotenv/config";
import { generateText } from "../server/services/gemini.js";
try {
  const text = await generateText("Trả lời duy nhất OK.");
  console.log(
    JSON.stringify({
      connected: true,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      responseLength: text.length,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      connected: false,
      code: error.code,
      providerHttpStatus: error.providerHttpStatus,
      providerStatus: error.providerStatus,
      reason: error.providerReason,
      message: error.message,
    }),
  );
  process.exitCode = 1;
}
