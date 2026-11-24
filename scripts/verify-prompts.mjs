import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const names = [
  "geminiPracticeService",
  "geminiPracticeServiceTiSo",
  "geminiPracticeServiceTimeVelocity",
  "geminiPracticeServiceSoThapPhan",
  "geminiChatService",
  "geminiChatServiceTiSo",
  "geminiChatServiceTimeVelocity",
  "geminiChatServiceSoThapPhan",
];
const rows = [];
for (const name of names) {
  const source = await readFile(
    new URL(`../../Math-AI/src/services/gemini/${name}.js`, import.meta.url),
    "utf8",
  );
  const expected =
    `// Imported from Math-AI/src/services/gemini/${name}.js. Prompt reference; see docs/ANALYSIS.md.\n` +
    source.replace(
      /from (["'])(\.[^"']+)\1/g,
      (_, quote, path) =>
        `from ${quote}${path.replace("../../constants/", "../constants/")}${path.endsWith(".js") ? "" : ".js"}${quote}`,
    );
  const copy = await readFile(
    new URL(`../server/legacy/gemini/${name}.js`, import.meta.url),
    "utf8",
  );
  assert.equal(copy, expected, `Prompt source changed: ${name}`);
  rows.push(
    `| ${name}.js | ${createHash("sha256").update(source).digest("hex")} | Khớp |`,
  );
}
assert.equal(
  await readFile(
    new URL("../server/legacy/constants/examContexts.js", import.meta.url),
    "utf8",
  ),
  await readFile(
    new URL("../../Math-AI/src/constants/examContexts.js", import.meta.url),
    "utf8",
  ),
);
const report = [
  "# Đối chiếu prompt Math-AI → Mathate",
  "",
  "Kết quả: **8/8 service khớp toàn bộ nội dung nguồn**, ngoại trừ đường dẫn import tương đối để chạy ESM và một dòng chú thích nguồn. SHA-256 dưới đây tính trên nguyên văn file Math-AI trước khi sửa import. examContexts.js cũng khớp nguyên văn.",
  "",
  "| File gốc | SHA-256 nguồn Math-AI | Đối chiếu |",
  "|---|---|---|",
  ...rows,
  "",
  "Không sửa trực tiếp 8 bản sao dưới server/legacy/gemini/. File geminiModelManager.js là adapter truyền tải mới, không phải bản sao service prompt.",
  "",
  "Các ngoại lệ cho Mathate chỉ nằm ở server/prompts/adapt-math-ai.js và các hook trong server/services/prompts.js. Xem docs/PROMPTS.md để biết phạm vi từng ngoại lệ.",
  "",
  "Chạy lại: npm run verify:prompts. Yêu cầu repo Math-AI ở thư mục anh em ../Math-AI; script sẽ báo lỗi nếu bất kỳ nội dung sao chép nào lệch nguồn.",
  "",
].join("\n");
await writeFile(new URL("../docs/PROMPT-PARITY.md", import.meta.url), report);
console.log(
  "Verified 8/8 source services and contexts. Report: docs/PROMPT-PARITY.md",
);
