import { GoogleAuth } from "google-auth-library";
import { vietnameseVoices } from "../../shared/speech.js";

export function ttsAuthOptions(env = process.env) {
  const options = {
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  };
  if (env.TTS_SERVICE_ACCOUNT)
    return { ...options, credentials: JSON.parse(env.TTS_SERVICE_ACCOUNT) };
  if (env.TTS_APPLICATION_CREDENTIALS)
    return { ...options, keyFilename: env.TTS_APPLICATION_CREDENTIALS };
  // Also accept the exact environment formats used by Math-AI's server and api/tts.js.
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON)
    return {
      ...options,
      credentials: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON),
    };
  if (
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )
    return {
      ...options,
      credentials: {
        type: "service_account",
        project_id: env.GCP_PROJECT_ID,
        client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
          /\\n/g,
          "\n",
        ),
      },
    };
  if (env.FIREBASE_SERVICE_ACCOUNT)
    return {
      ...options,
      credentials: JSON.parse(env.FIREBASE_SERVICE_ACCOUNT),
    };
  if (env.GOOGLE_APPLICATION_CREDENTIALS || env.GOOGLE_CLOUD_PROJECT)
    return options;
  throw Object.assign(
    new Error(
      "Chưa cấu hình giọng đọc tiếng Việt trên máy chủ. Cần cấu hình Cloud TTS như Math-AI.",
    ),
    { status: 503 },
  );
}
export function ttsConfigured(env = process.env) {
  try {
    ttsAuthOptions(env);
    return true;
  } catch {
    return false;
  }
}
let clientPromise;
export async function synthesizeSpeech(
  text,
  voiceGender = "FEMALE",
  { client } = {},
) {
  const voice = vietnameseVoices[voiceGender];
  if (!voice)
    throw Object.assign(new Error("Giọng đọc không hợp lệ."), { status: 400 });
  if (!client) {
    if (!clientPromise)
      clientPromise = new GoogleAuth(ttsAuthOptions())
        .getClient()
        .catch((error) => {
          clientPromise = null;
          throw error;
        });
    client = await clientPromise;
  }
  try {
    const result = await client.request({
      url: "https://texttospeech.googleapis.com/v1/text:synthesize",
      method: "POST",
      data: {
        input: { text },
        voice: {
          languageCode: "vi-VN",
          name: voice.name,
          ssmlGender: voiceGender,
        },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
      },
      timeout: 20000,
    });
    const audioContent = result.data?.audioContent;
    if (!audioContent) throw new Error("Empty TTS audio");
    return {
      success: true,
      audioContent,
      voiceName: voice.name,
      languageCode: "vi-VN",
    };
  } catch (error) {
    const code = error.response?.data?.error?.status;
    console.error(`[Cloud TTS] ${code || error.code || "SYNTHESIS_FAILED"}`);
    throw Object.assign(
      new Error(
        code === "PERMISSION_DENIED"
          ? "Cloud TTS chưa được bật hoặc tài khoản chưa có quyền đọc tiếng Việt. Kiểm tra cấu hình máy chủ nhé."
          : "Chưa kết nối được giọng đọc tiếng Việt. Bạn thử lại sau một chút nhé.",
      ),
      { status: 502 },
    );
  }
}
