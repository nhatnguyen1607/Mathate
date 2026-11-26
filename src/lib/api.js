import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { createApiClient } from "./api-client";
export function demoId() {
  return localStorage.getItem("mathate-demo-id");
}
export function startDemo() {
  if (!demoId()) localStorage.setItem("mathate-demo-id", crypto.randomUUID());
}
export function endDemo() {
  localStorage.removeItem("mathate-demo-id");
}
export const api = createApiClient({ auth, signOut, demoId });
