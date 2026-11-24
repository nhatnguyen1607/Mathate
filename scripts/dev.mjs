import { spawn } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
const children = [
  spawn(process.execPath, ["--watch", "--env-file=.env", "server/index.js"], {
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    { stdio: "inherit" },
  ),
];
const stop = () => children.forEach((child) => child.kill());
process.on("SIGINT", () => {
  stop();
  process.exit();
});
process.on("SIGTERM", () => {
  stop();
  process.exit();
});
children.forEach((child) =>
  child.on("exit", (code) => {
    if (code) {
      stop();
      process.exit(code);
    }
  }),
);
