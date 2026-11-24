export async function generateText(prompt, { json = false } = {}) {
  if (!process.env.GEMINI_API_KEY)
    throw Object.assign(
      new Error("Chưa cấu hình Gemini. Vui lòng thử chế độ trải nghiệm."),
      { status: 503 },
    );
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
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
    if (![429, 503].includes(response.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  if (!response.ok)
    throw Object.assign(
      new Error(
        response.status === 429
          ? "Mimo đang có nhiều bạn ghé thăm. Bạn thử lại sau một chút nhé."
          : "Chưa kết nối được Gemini. Vui lòng kiểm tra khóa và model trong cấu hình máy chủ.",
      ),
      { status: 502 },
    );
  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("") || "";
  if (!text.trim())
    throw Object.assign(
      new Error("Mimo chưa nhận được nội dung. Bạn thử lại nhé."),
      { status: 502 },
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
      { status: 502 },
    );
  }
}
