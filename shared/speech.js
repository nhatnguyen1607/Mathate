// Voice names, gender and audio settings retained from Math-AI/api/tts.js.
export const vietnameseVoices = Object.freeze({
  FEMALE: { name: "vi-VN-Wavenet-A", label: "Giọng nữ" },
  MALE: { name: "vi-VN-Wavenet-B", label: "Giọng nam" },
});
export function speechChunks(text, maxBytes = 4200) {
  const words = String(text || "")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  const encoder = new TextEncoder();
  const chunks = [];
  let current = "";
  for (const word of words) {
    if (encoder.encode(word).length > maxBytes)
      throw new Error(
        "Đoạn văn quá dài để đọc. Bạn chọn một đoạn ngắn hơn nhé.",
      );
    const next = current ? `${current} ${word}` : word;
    if (encoder.encode(next).length > maxBytes) {
      chunks.push(current);
      current = word;
    } else current = next;
  }
  if (current) chunks.push(current);
  return chunks;
}
