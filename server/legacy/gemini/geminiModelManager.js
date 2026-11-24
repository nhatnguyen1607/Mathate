// Transport only; AsyncLocalStorage isolates simultaneous users' model calls.
import { AsyncLocalStorage } from "node:async_hooks";
const context = new AsyncLocalStorage();
async function generateContent(content) {
  const active = context.getStore();
  if (!active) throw new Error("Legacy AI call outside a Mathate request.");
  try {
    const text = await active.generate(content);
    return { response: { text: () => text } };
  } catch (error) {
    active.error = error;
    throw error;
  }
}
export async function withLegacyModel(generate, run) {
  const active = { generate, error: null };
  return context.run(active, async () => {
    const result = await run();
    if (active.error) throw active.error;
    return result;
  });
}
export default { generateContent, getModel: () => ({ generateContent }) };
