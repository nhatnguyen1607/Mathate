import "dotenv/config";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  avatarUploadSignature,
  verifyAvatar,
  cloudinarySignature,
} from "../server/services/cloudinary.js";
const uid = "qa-avatar-" + randomUUID();
const signed = avatarUploadSignature(uid);
let uploaded = false;
try {
  const data = new FormData();
  data.set(
    "file",
    new Blob([await readFile("public/mimo.png")], { type: "image/png" }),
    "avatar-check.png",
  );
  data.set("api_key", signed.apiKey);
  data.set("signature", signed.signature);
  for (const [key, value] of Object.entries(signed.params))
    data.set(key, String(value));
  const response = await fetch(signed.uploadUrl, {
    method: "POST",
    body: data,
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok)
    throw new Error("Cloudinary upload HTTP " + response.status);
  const result = await response.json();
  uploaded = true;
  const url = verifyAvatar(uid, result);
  const delivered = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!delivered.ok)
    throw new Error("Avatar delivery HTTP " + delivered.status);
  await delivered.arrayBuffer();
  console.log(
    JSON.stringify({
      upload: true,
      verified: true,
      deliveryStatus: delivered.status,
      width: result.width,
      height: result.height,
    }),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (uploaded) {
    const config = new URL(process.env.CLOUDINARY_URL);
    const params = {
      public_id: signed.params.public_id,
      timestamp: Math.floor(Date.now() / 1000),
      invalidate: true,
    };
    const body = new URLSearchParams({
      ...params,
      api_key: signed.apiKey,
      signature: cloudinarySignature(
        params,
        decodeURIComponent(config.password),
      ),
    });
    const response = await fetch(
      signed.uploadUrl.replace("/upload", "/destroy"),
      { method: "POST", body, signal: AbortSignal.timeout(30000) },
    );
    const result = await response.json();
    console.log(JSON.stringify({ testAssetRemoved: result.result === "ok" }));
    if (!response.ok || result.result !== "ok") process.exitCode = 1;
  }
}
