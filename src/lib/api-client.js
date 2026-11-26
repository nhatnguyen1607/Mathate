const expiredSession = () =>
  Object.assign(
    new Error("Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé."),
    { status: 401 },
  );
const invalidSessionCodes = new Set([
  "auth/user-token-expired",
  "auth/invalid-user-token",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/id-token-revoked",
]);

// Dependencies keep the actual request/refresh lifecycle testable without a
// Firebase account. Firebase owns persistent token storage and token rotation.
export function createApiClient({
  auth,
  signOut,
  demoId,
  fetch: request = globalThis.fetch,
}) {
  const refreshing = new WeakMap();
  async function clearSession(user) {
    if (auth.currentUser === user) await signOut(auth);
  }
  async function tokenFor(user, failedToken) {
    try {
      const token = await user.getIdToken();
      if (!failedToken || token !== failedToken) return token;
      if (!refreshing.has(user)) {
        const pending = user
          .getIdToken(true)
          .finally(() => refreshing.delete(user));
        refreshing.set(user, pending);
      }
      return await refreshing.get(user);
    } catch (error) {
      if (invalidSessionCodes.has(error.code)) {
        await clearSession(user);
        throw expiredSession();
      }
      throw Object.assign(
        new Error(
          "Chưa thể gia hạn phiên đăng nhập. Bạn kiểm tra kết nối rồi thử lại nhé.",
        ),
        { cause: error },
      );
    }
  }
  return async function api(path, options = {}) {
    await auth.authStateReady();
    const user = auth.currentUser;
    let token = user ? await tokenFor(user) : null;
    const { body, blob, headers: suppliedHeaders, ...settings } = options;
    const send = () => {
      if (auth.currentUser !== user) throw expiredSession();
      return request(`/api${path}`, {
        cache: "no-store",
        credentials: "same-origin",
        ...settings,
        headers: {
          "Content-Type": "application/json",
          ...suppliedHeaders,
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : demoId()
              ? { "X-Mathate-Demo": demoId() }
              : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    };
    let response = await send();
    // Only a rejected authentication can replay the request: the server's auth
    // middleware runs before mutations. Never replay network errors or 403/5xx.
    if (response.status === 401 && user) {
      if (auth.currentUser !== user) throw expiredSession();
      token = await tokenFor(user, token);
      response = await send();
      if (response.status === 401) {
        await clearSession(user);
        throw expiredSession();
      }
    }
    if (auth.currentUser !== user) throw expiredSession();
    if (response.status === 204) return null;
    if (response.ok && blob) return response.blob();
    const data = await response
      .json()
      .catch(() => ({ error: "Không kết nối được máy chủ. Bạn thử lại nhé." }));
    if (!response.ok)
      throw Object.assign(
        new Error(data.error || "Có chút trục trặc. Bạn thử lại nhé."),
        { status: response.status },
      );
    return data;
  };
}
