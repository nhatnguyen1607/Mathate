import { auth } from "./firebase";
export function demoId() {
  return localStorage.getItem("mathate-demo-id");
}
export function startDemo() {
  if (!demoId()) localStorage.setItem("mathate-demo-id", crypto.randomUUID());
}
export function endDemo() {
  localStorage.removeItem("mathate-demo-id");
}
export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth.currentUser)
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  else if (demoId()) headers["X-Mathate-Demo"] = demoId();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (response.status === 204) return null;
  const data = await response
    .json()
    .catch(() => ({ error: "Không kết nối được máy chủ. Bạn thử lại nhé." }));
  if (!response.ok)
    throw new Error(data.error || "Có chút trục trặc. Bạn thử lại nhé.");
  return data;
}
