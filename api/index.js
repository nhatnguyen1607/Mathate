// Vercel invokes Express directly; only server/index.js opens a local port.
export { app as default } from "../server/app.js";
