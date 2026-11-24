import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "dotenv";

// Read local credentials without printing their values or changing local .env.
const local = parse(await readFile(".env", "utf8"));
const values = {};
for (const name of [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "GEMINI_API_KEY",
  "CLOUDINARY_URL",
]) {
  if (!local[name]?.trim()) throw new Error(`Missing configuration: ${name}`);
  values[name] = local[name];
}
values.GEMINI_MODEL = local.GEMINI_MODEL || "gemini-2.5-flash";
values.FIREBASE_PROJECT_ID =
  local.FIREBASE_PROJECT_ID || local.VITE_FIREBASE_PROJECT_ID;
async function account(jsonName, pathName) {
  let raw = local[jsonName];
  if (!raw && local[pathName])
    raw = await readFile(resolve(local[pathName]), "utf8");
  if (!raw)
    throw new Error(`Missing configuration: ${jsonName} or ${pathName}`);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON: ${jsonName}`);
  }
  if (
    data.type !== "service_account" ||
    !data.private_key ||
    !data.client_email
  )
    throw new Error(`Invalid service account: ${jsonName}`);
  return JSON.stringify(data);
}
values.FIREBASE_SERVICE_ACCOUNT = await account(
  "FIREBASE_SERVICE_ACCOUNT",
  "GOOGLE_APPLICATION_CREDENTIALS",
);
values.TTS_SERVICE_ACCOUNT = await account(
  "TTS_SERVICE_ACCOUNT",
  "TTS_APPLICATION_CREDENTIALS",
);
values.DEMO_MODE = "false";

// Single quotes preserve JSON's literal \n sequences in private_key.
for (const [name, value] of Object.entries(values)) {
  if (/[\r\n']/.test(value))
    throw new Error(`Unsupported dotenv quoting: ${name}`);
}
const output =
  "# Vercel import only. Contains secrets: do not commit or share.\n" +
  Object.entries(values)
    .map(([name, value]) => `${name}='${value}'`)
    .join("\n") +
  "\n";
const parsed = parse(output);
for (const [name, value] of Object.entries(values)) {
  if (parsed[name] !== value)
    throw new Error(`Round-trip validation failed: ${name}`);
}
for (const name of ["FIREBASE_SERVICE_ACCOUNT", "TTS_SERVICE_ACCOUNT"]) {
  const credential = JSON.parse(parsed[name]);
  if (!credential.private_key.includes("\n"))
    throw new Error(`Invalid private-key newlines: ${name}`);
}
await writeFile(".env.vercel", output, { mode: 0o600 });
console.log(
  `Created .env.vercel: ${Object.keys(values).length} variables; dotenv and credential JSON validated. No secret values printed.`,
);
