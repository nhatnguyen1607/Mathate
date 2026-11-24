import { createHash, timingSafeEqual } from "node:crypto";

function configuration() {
  try {
    const value = new URL(process.env.CLOUDINARY_URL);
    if (
      value.protocol !== "cloudinary:" ||
      !value.username ||
      !value.password ||
      !value.hostname
    )
      throw new Error();
    return {
      cloud: value.hostname,
      key: decodeURIComponent(value.username),
      secret: decodeURIComponent(value.password),
    };
  } catch {
    throw Object.assign(
      new Error("Máy chủ chưa cấu hình Cloudinary để tải ảnh đại diện."),
      { status: 503 },
    );
  }
}
export function cloudinarySignature(params, secret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(payload + secret)
    .digest("hex");
}
function avatarId(uid) {
  return "mathate/avatars/" + createHash("sha256").update(uid).digest("hex");
}
export function avatarUploadSignature(uid) {
  const config = configuration();
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    public_id: avatarId(uid),
    overwrite: true,
    invalidate: true,
    allowed_formats: "jpg,jpeg,png,webp",
    transformation: "c_limit,h_512,w_512",
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`,
    apiKey: config.key,
    params,
    signature: cloudinarySignature(params, config.secret),
  };
}
export function verifyAvatar(uid, upload) {
  const config = configuration();
  const expectedId = avatarId(uid);
  const expected = cloudinarySignature(
    { public_id: expectedId, version: upload.version },
    config.secret,
  );
  const valid =
    upload.public_id === expectedId &&
    /^[a-f0-9]{40}$/.test(upload.signature) &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(upload.signature));
  if (!valid)
    throw Object.assign(
      new Error("Chưa xác minh được ảnh đã tải lên. Bạn chọn lại ảnh nhé."),
      { status: 400 },
    );
  return `https://res.cloudinary.com/${config.cloud}/image/upload/c_fill,w_160,h_160,g_auto,q_auto,f_auto/v${upload.version}/${expectedId}`;
}
