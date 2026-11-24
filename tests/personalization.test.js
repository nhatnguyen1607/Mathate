import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  avatarUploadSignature,
  verifyAvatar,
  cloudinarySignature,
} from "../server/services/cloudinary.js";
import {
  companions,
  themes,
  companionAsset,
} from "../shared/personalization.js";

test("Cloudinary signing restricts avatar path/formats and verifies response ownership without exposing secret", (t) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL =
    "cloudinary://test-key:test-secret@example-cloud";
  t.after(() => {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  });
  const signed = avatarUploadSignature("learner-one");
  assert.equal(JSON.stringify(signed).includes("test-secret"), false);
  assert.equal(
    signed.signature,
    cloudinarySignature(signed.params, "test-secret"),
  );
  assert.equal(signed.params.allowed_formats, "jpg,jpeg,png,webp");
  assert.notEqual(
    signed.params.public_id,
    avatarUploadSignature("learner-two").params.public_id,
  );
  const upload = {
    public_id: signed.params.public_id,
    version: 123,
    signature: cloudinarySignature(
      { public_id: signed.params.public_id, version: 123 },
      "test-secret",
    ),
  };
  assert.ok(
    verifyAvatar("learner-one", upload).startsWith(
      "https://res.cloudinary.com/example-cloud/image/upload/",
    ),
  );
  assert.throws(() => verifyAvatar("learner-two", upload), { status: 400 });
  assert.throws(
    () => verifyAvatar("learner-one", { ...upload, signature: "0".repeat(40) }),
    { status: 400 },
  );
});
test("Profile API persists only personal fields, isolates users and blocks demo uploads", async (t) => {
  process.env.DEMO_MODE = "true";
  const { app } = await import("../server/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const uid = randomUUID();
  const request = (path, body, id = uid, method = body ? "PATCH" : "GET") =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", "X-Mathate-Demo": id },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const result = await request("/profile", {
    displayName: "An",
    nickname: "Bé An",
    companion: "cat",
    theme: "violet",
  });
  assert.equal(result.status, 200);
  const profile = await result.json();
  assert.equal(profile.nickname, "Bé An");
  assert.equal(profile.xp, 0);
  assert.equal((await (await request("/profile")).json()).companion, "cat");
  assert.equal(
    (await (await request("/profile", undefined, randomUUID())).json())
      .companion,
    undefined,
  );
  for (const body of [
    { xp: 9999 },
    { admin: true },
    { avatarUrl: "https://untrusted/avatar.svg" },
    { theme: "invalid" },
    { companion: "invalid" },
    { displayName: "" },
  ])
    assert.equal((await request("/profile", body)).status, 400);
  assert.equal(
    (await request("/profile/avatar/signature", {}, uid, "POST")).status,
    403,
  );
  assert.equal((await request("/profile/avatar", {}, uid, "POST")).status, 403);
  assert.equal(
    (
      await fetch(base + "/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
});
test("Companion assets are scoped to known characters and primary theme colors meet white-text contrast", () => {
  for (const companion of companions) {
    assert.match(companionAsset(companion.id, "thinking"), /^\/mascots\//);
  }
  assert.equal(companionAsset("invalid", "invalid"), "/mimo.png");
  const linear = (x) =>
    x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  for (const theme of themes) {
    const rgb = theme.color
      .slice(1)
      .match(/../g)
      .map((c) => linear(parseInt(c, 16) / 255));
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    assert.ok(1.05 / (luminance + 0.05) >= 4.5, theme.name);
  }
});
