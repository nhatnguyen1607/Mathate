import test from "node:test";
import assert from "node:assert/strict";
import { geminiHTTPError } from "../server/services/gemini-errors.js";
import { generateText } from "../server/services/gemini.js";

test("Gemini errors distinguish leaked/invalid keys, permission, model, quota and transient errors", () => {
  const cases = [
    [
      403,
      {
        error: {
          message:
            "Your API key was reported as leaked. Please use another API key.",
          status: "PERMISSION_DENIED",
        },
      },
      "GEMINI_KEY_LEAKED",
      503,
    ],
    [
      400,
      { error: { message: "API key not valid", status: "INVALID_ARGUMENT" } },
      "GEMINI_KEY_INVALID",
      503,
    ],
    [
      403,
      { error: { status: "PERMISSION_DENIED" } },
      "GEMINI_PERMISSION_DENIED",
      503,
    ],
    [404, { error: { status: "NOT_FOUND" } }, "GEMINI_MODEL_NOT_FOUND", 503],
    [
      429,
      { error: { status: "RESOURCE_EXHAUSTED" } },
      "GEMINI_QUOTA_EXCEEDED",
      429,
    ],
    [
      503,
      { error: { status: "UNAVAILABLE" } },
      "GEMINI_TEMPORARILY_UNAVAILABLE",
      503,
    ],
  ];
  for (const [http, body, code, status] of cases) {
    const result = geminiHTTPError(http, body, "gemini-2.5-flash");
    assert.equal(result.code, code);
    assert.equal(result.status, status);
    assert.equal(result.providerHttpStatus, http);
  }
});
function setup(t) {
  const before = {
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  };
  process.env.GEMINI_API_KEY = "unit-test-token-never-log";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
  t.after(() => {
    if (before.key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = before.key;
    if (before.model === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = before.model;
  });
}
test("Gemini retries transient HTTP 500 without modifying the original prompt", async (t) => {
  setup(t);
  let calls = 0;
  const delays = [];
  const result = await generateText("Giữ nguyên đề bài và prompt.", {
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(
        JSON.parse(options.body).contents[0].parts[0].text,
        "Giữ nguyên đề bài và prompt.",
      );
      return calls === 1
        ? Response.json({ error: { status: "INTERNAL" } }, { status: 500 })
        : Response.json({
            candidates: [{ content: { parts: [{ text: "OK" }] } }],
          });
    },
    wait: async (ms) => delays.push(ms),
  });
  assert.equal(result, "OK");
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1500]);
});
test("Gemini does not retry bad keys and never returns/logs raw provider data or keys", async (t) => {
  setup(t);
  let calls = 0;
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args.join(" ")));
  await assert.rejects(
    generateText("Private child response", {
      fetchImpl: async () => {
        calls++;
        return Response.json(
          {
            error: {
              message: `API key not valid: ${process.env.GEMINI_API_KEY}`,
              status: "INVALID_ARGUMENT",
              details: [{ reason: "API_KEY_INVALID" }],
            },
          },
          { status: 400 },
        );
      },
      wait: async () => assert.fail("Must not retry invalid keys"),
    }),
    (error) => {
      assert.equal(error.code, "GEMINI_KEY_INVALID");
      assert.equal(
        JSON.stringify(error).includes(process.env.GEMINI_API_KEY),
        false,
      );
      assert.equal(error.message.includes(process.env.GEMINI_API_KEY), false);
      return true;
    },
  );
  assert.equal(calls, 1);
  assert.equal(logs.join("").includes(process.env.GEMINI_API_KEY), false);
  assert.equal(logs.join("").includes("Private child response"), false);
});
test("Network errors are safe and distinguishable from provider rejection", async (t) => {
  setup(t);
  await assert.rejects(
    generateText("test", {
      fetchImpl: async () => {
        throw new Error(`network details ${process.env.GEMINI_API_KEY}`);
      },
    }),
    (error) => {
      assert.equal(error.code, "GEMINI_NETWORK_ERROR");
      assert.equal(error.status, 503);
      assert.equal(
        JSON.stringify(error).includes(process.env.GEMINI_API_KEY),
        false,
      );
      return true;
    },
  );
});
test("Invalid model configuration does not send a request or echo configuration values", async (t) => {
  setup(t);
  process.env.GEMINI_MODEL = process.env.GEMINI_API_KEY;
  await assert.rejects(
    generateText("test", {
      fetchImpl: async () => assert.fail("Invalid model must not be requested"),
    }),
    (error) => {
      assert.equal(error.code, "GEMINI_MODEL_INVALID");
      assert.equal(
        JSON.stringify(error).includes(process.env.GEMINI_API_KEY),
        false,
      );
      return true;
    },
  );
});
