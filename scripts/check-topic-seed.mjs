import "dotenv/config";
import { store } from "../server/services/store.js";
try {
  const before = await store.topics(false, true);
  await store.seed();
  const after = await store.topics(false, true);
  console.log(
    JSON.stringify({ ok: true, before: before.length, after: after.length }),
  );
} catch (error) {
  console.error(
    JSON.stringify({ ok: false, code: error.code, name: error.name }),
  );
  process.exitCode = 1;
}
