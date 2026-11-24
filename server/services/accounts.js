import { auth } from "./store.js";

export function publicAccount(user) {
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    admin: user.customClaims?.admin === true,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime || null,
    lastSignInAt: user.metadata.lastSignInTime || null,
    providers: user.providerData.map((p) => p.providerId),
  };
}
export async function listAccounts({ query, pageToken }) {
  if (query) {
    try {
      const user = query.includes("@")
        ? await auth.getUserByEmail(query)
        : await auth.getUser(query);
      return { users: [publicAccount(user)], nextPageToken: null };
    } catch (error) {
      if (error.code === "auth/user-not-found")
        return { users: [], nextPageToken: null };
      throw error;
    }
  }
  const result = await auth.listUsers(50, pageToken);
  return {
    users: result.users.map(publicAccount),
    nextPageToken: result.pageToken || null,
  };
}
export async function updateAccount(uid, changes, actorUid) {
  const user = await auth.getUser(uid);
  if (
    changes.disabled === true &&
    (uid === actorUid || user.customClaims?.admin === true)
  )
    throw Object.assign(
      new Error("Không thể khóa tài khoản của bạn hoặc quản trị viên khác."),
      { status: 409 },
    );
  const updated = await auth.updateUser(uid, changes);
  if (changes.disabled === true) await auth.revokeRefreshTokens(uid);
  return publicAccount(updated);
}
