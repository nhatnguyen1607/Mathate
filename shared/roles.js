export function accountRole(claims = {}) {
  if (claims.admin === true) return "admin";
  return claims.role === "teacher" ? "teacher" : "student";
}
export const roleNames = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
};
