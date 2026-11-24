import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import "dotenv/config";
process.env.NODE_ENV = "production";
process.env.DEMO_MODE = "true";
const { app } = await import("../server/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.demoEnabled, false);
  const demo = await fetch(`${base}/api/profile`, {
    headers: { "X-Mathate-Demo": "1a5a74a8-04f7-4d0c-b602-6275023225a6" },
  });
  assert.equal(demo.status, 401);
  for (const path of [
    "/",
    "/journey",
    "/login",
    "/collection",
    "/practice/test",
    "/account",
  ]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('<div id="root"></div>'));
  }
  async function checkFiles(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await checkFiles(path);
      else if (/\.(js|css|html|json)$/.test(entry.name)) {
        const text = await readFile(path, "utf8");
        if (process.env.GEMINI_API_KEY)
          assert.ok(
            !text.includes(process.env.GEMINI_API_KEY),
            "AI key found in browser build",
          );
        if (process.env.CLOUDINARY_URL) {
          const secret = decodeURIComponent(
            new URL(process.env.CLOUDINARY_URL).password,
          );
          assert.ok(
            !text.includes(secret),
            "Cloudinary secret found in browser build",
          );
        }
        assert.ok(
          !text.includes("BEGIN PRIVATE KEY"),
          "Private key found in browser build",
        );
      }
    }
  }
  await checkFiles("dist");
  console.log(
    "Release verified: production disables demo, API rejects guests, SPA routes serve correctly, no Gemini/Cloudinary secrets or private keys in browser build.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
