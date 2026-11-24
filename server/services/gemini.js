import { geminiHTTPError } from "./gemini-errors.js";
export async function generateText(
  prompt,
  {
    json = false,
    fetchImpl = fetch,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash")
    .trim()
    .replace(/^models\//, "");
  if (!/^gemini-[a-zA-Z0-9._-]+$/.test(model))
    throw Object.assign(
      new Error(
        "GEMINI_MODEL chưa đúng định dạng tên model Gemini. Kiểm tra cấu hình máy chủ.",
      ),
      { status: 503, code: "GEMINI_MODEL_INVALID" },
    );
  if (!key)
    throw Object.assign(
      new Error("Chưa cấu hình Gemini. Vui lòng thử chế độ trải nghiệm."),
      { status: 503, code: "GEMINI_NOT_CONFIGURED" },
    );
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.55,
              ...(json ? { responseMimeType: "application/json" } : {}),
              maxOutputTokens: 8192,
            },
          }),
        },
      );
    } catch (error) {
      throw Object.assign(
        new Error(
          error.name === "TimeoutError"
            ? "Gemini phản hồi quá lâu. Bạn thử lại nhé."
            : "Máy chủ chưa kết nối được Google Gemini. Kiểm tra mạng hoặc proxy của backend.",
        ),
        {
          status: 503,
          code:
            error.name === "TimeoutError"
              ? "GEMINI_TIMEOUT"
              : "GEMINI_NETWORK_ERROR",
          model,
        },
      );
    }
    if (
      ![408, 429, 500, 502, 503, 504].includes(response.status) ||
      attempt === 1
    )
      break;
    await response.arrayBuffer().catch(() => {});
    await wait(1500 * 2 ** attempt);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = geminiHTTPError(response.status, body, model);
    console.error(
      "[Gemini]",
      JSON.stringify({
        code: error.code,
        httpStatus: error.providerHttpStatus,
        providerStatus: error.providerStatus,
        reason: error.providerReason,
        model,
      }),
    );
    throw error;
  }
  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("") || "";
  if (!text.trim())
    throw Object.assign(
      new Error("Mimo chưa nhận được nội dung. Bạn thử lại nhé."),
      { status: 502, code: "GEMINI_EMPTY_RESPONSE" },
    );
  return text;
}
export async function generateJSON(prompt, schema) {
  const text = await generateText(prompt, { json: true });
  try {
    return schema.parse(
      JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")),
    );
  } catch {
    throw Object.assign(
      new Error("Mimo chưa tạo được nội dung phù hợp. Bạn thử lại nhé."),
      { status: 502, code: "GEMINI_INVALID_OUTPUT" },
    );
  }
}
