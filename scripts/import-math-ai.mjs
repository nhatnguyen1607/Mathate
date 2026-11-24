import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
const source = resolve("../Math-AI");
const root = resolve("server/legacy");
mkdirSync(`${root}/gemini`, { recursive: true });
mkdirSync(`${root}/constants`, { recursive: true });
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
for (const name of names) {
  const content = readFileSync(
    `${source}/src/services/gemini/${name}.js`,
    "utf8",
  ).replace(
    /from (["'])(\.[^"']+)\1/g,
    (_, quote, path) =>
      `from ${quote}${path.replace("../../constants/", "../constants/")}${path.endsWith(".js") ? "" : ".js"}${quote}`,
  );
  writeFileSync(
    `${root}/gemini/${name}.js`,
    `// Imported from Math-AI/src/services/gemini/${name}.js. Prompt reference; see docs/ANALYSIS.md.\n${content}`,
  );
}
copyFileSync(
  `${source}/src/constants/examContexts.js`,
  `${root}/constants/examContexts.js`,
);
mkdirSync("public/models", { recursive: true });
copyFileSync(
  `${source}/public/models/scene.splinecode`,
  "public/models/scene.splinecode",
);
console.log(
  "Imported 8 prompt services, contexts and the original robot model.",
);
