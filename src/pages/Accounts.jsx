import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  RefreshCw,
  Pencil,
  LockKeyhole,
  LockKeyholeOpen,
  Users,
  ChevronRight,
} from "lucide-react";
import { api } from "../lib/api";
import { ErrorBox, Empty, Spinner } from "../components/ui";
import useDialog from "../hooks/useDialog";
import { roleNames } from "../../shared/roles";
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "Chưa đăng nhập";
export function AccountTable({ users, actorUid, busy, onEdit, onToggle }) {
  return (
    <div className="account-table-wrap">
      <table className="account-table">
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Đăng nhập gần nhất</th>
            <th>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td>
                <div className="account-person">
                  <span className="account-avatar" aria-hidden="true">
                    {(user.displayName || user.email || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {user.displayName || "Chưa đặt tên"}
                      {user.uid === actorUid && (
                        <small className="account-you">Bạn</small>
                      )}
                    </strong>
                    <span>{user.email || "Chưa có email"}</span>
                    <small title={user.uid}>UID: {user.uid}</small>
                  </div>
                </div>
              </td>
              <td>
                <span
                  className={user.admin ? "account-role admin" : "account-role"}
                >
                  {roleNames[user.role || (user.admin ? "admin" : "student")]}
                </span>
              </td>
              <td>
                <span
                  className={
                    "account-status " + (user.disabled ? "locked" : "active")
                  }
                >
                  <i />
                  {user.disabled ? "Đã khóa" : "Hoạt động"}
                </span>
              </td>
              <td className="account-date">{date(user.lastSignInAt)}</td>
              <td>
                <div className="account-actions">
                  <button
                    className="icon-button"
                    disabled={busy}
                    aria-label={"Sửa tài khoản " + (user.email || user.uid)}
                    onClick={() => onEdit(user)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={busy || user.admin || user.uid === actorUid}
                    title={user.admin ? "Không khóa quản trị viên" : undefined}
                    aria-label={
                      (user.disabled ? "Mở khóa " : "Khóa ") +
                      (user.email || user.uid)
                    }
                    onClick={() => onToggle(user)}
                  >
                    {user.disabled ? (
                      <LockKeyholeOpen size={17} />
                    ) : (
                      <LockKeyhole size={17} />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Accounts({ actorUid }) {
  const [users, setUsers] = useState([]),
    [query, setQuery] = useState(""),
    [applied, setApplied] = useState(""),
    [next, setNext] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editing, setEditing] = useState(null),
    [name, setName] = useState(""),
    [role, setRole] = useState("student"),
    [confirm, setConfirm] = useState(null),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useDialog(!!confirm, ".account-confirm", () => setConfirm(null), busy);
  async function load(search = "", token = null) {
    const own = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      if (token) params.set("pageToken", token);
      const result = await api("/admin/accounts?" + params);
      if (own !== generation.current) return;
      setUsers((old) => (token ? [...old, ...result.users] : result.users));
      setNext(result.nextPageToken);
      setApplied(search);
    } catch (e) {
      if (own === generation.current) setError(e.message);
    } finally {
      if (own === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    load();
    return () => {
      generation.current++;
    };
  }, []);
  async function update(user, changes) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(
        "/admin/accounts/" + encodeURIComponent(user.uid),
        { method: "PATCH", body: changes },
      );
      setUsers((old) => old.map((u) => (u.uid === result.uid ? result : u)));
      setEditing(null);
      setConfirm(null);
      setNotice(
        changes.role
          ? `Đã lưu tài khoản với quyền ${roleNames[changes.role].toLowerCase()}. Người dùng tải lại trang hoặc đăng nhập lại để cập nhật giao diện.`
          : changes.displayName
            ? "Đã cập nhật tên tài khoản."
            : changes.disabled
              ? "Đã khóa tài khoản. Người dùng không thể tiếp tục truy cập."
              : "Đã mở khóa. Người dùng có thể đăng nhập lại.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="accounts-title">
      <div className="accounts-heading">
        <div>
          <h2 id="accounts-title">Tài khoản hệ thống</h2>
          <p>Theo dõi người học và quản lý quyền truy cập.</p>
        </div>
        <button
          className="button secondary"
          disabled={loading || busy}
          onClick={() => load(applied)}
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </div>
      <form
        className="accounts-search"
        onSubmit={(e) => {
          e.preventDefault();
          load(query.trim());
        }}
      >
        <label>
          <Search size={18} />
          <span className="sr-only">Tìm chính xác email hoặc UID</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập chính xác email hoặc UID…"
            maxLength={254}
          />
        </label>
        <button className="button" disabled={loading}>
          Tìm tài khoản
        </button>
        {applied && (
          <button
            type="button"
            className="text-button"
            disabled={loading}
            onClick={() => {
              setQuery("");
              load();
            }}
          >
            Xem tất cả
          </button>
        )}
      </form>
      <ErrorBox message={error} retry={() => load(applied)} />
      {notice && (
        <p className="success-notice" role="status">
          {notice}
        </p>
      )}
      {editing && (
        <form
          className="account-editor"
          onSubmit={(e) => {
            e.preventDefault();
            update(editing, {
              displayName: name.trim(),
              ...(!editing.admin && editing.uid !== actorUid ? { role } : {}),
            });
          }}
        >
          <div>
            <h3>Tên và quyền tài khoản</h3>
            <p>{editing.email}</p>
          </div>
          <label>
            Tên hiển thị
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={1}
              maxLength={60}
              required
            />
          </label>
          {!editing.admin && editing.uid !== actorUid && (
            <label>
              Vai trò
              <select
                aria-label="Vai trò"
                aria-describedby="account-role-help"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
              <small id="account-role-help">
                Tài khoản tải lại trang hoặc đăng nhập lại để thấy giao diện
                mới.
              </small>
            </label>
          )}
          <div className="editor-actions">
            <button className="button" disabled={busy || !name.trim()}>
              {busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
      {loading && !users.length ? (
        <Spinner text="Đang tải tài khoản…" />
      ) : users.length ? (
        <>
          <div className="account-list-summary">
            <span>
              {users.length} tài khoản{next ? " đã tải" : ""}
            </span>
            <span>50 tài khoản mỗi trang</span>
          </div>
          <AccountTable
            users={users}
            actorUid={actorUid}
            busy={busy}
            onEdit={(user) => {
              setEditing(user);
              setName(user.displayName);
              setRole(user.role || "student");
              setNotice("");
            }}
            onToggle={setConfirm}
          />
          {next && (
            <button
              className="button secondary load-accounts"
              disabled={loading}
              onClick={() => load(applied, next)}
            >
              {loading ? "Đang tải…" : "Tải thêm tài khoản"}
              <ChevronRight size={17} />
            </button>
          )}
        </>
      ) : (
        !error && (
          <Empty title="Không tìm thấy tài khoản">
            <Users size={30} />
            <p>Kiểm tra email hoặc UID rồi tìm lại nhé.</p>
          </Empty>
        )
      )}
      <p className="accounts-footnote">
        Tài khoản đăng ký qua email hoặc Google sẽ tự xuất hiện tại đây. Quản
        trị viên được bảo vệ khỏi thao tác khóa.
      </p>
      {confirm && (
        <div
          className="delete-confirm account-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="account-confirm-title"
        >
          <h2 id="account-confirm-title">
            {confirm.disabled ? "Mở khóa" : "Khóa"} tài khoản?
          </h2>
          <p>
            <strong>{confirm.email || confirm.displayName}</strong>
          </p>
          <p>
            {confirm.disabled
              ? "Người dùng sẽ có thể đăng nhập trở lại."
              : "Người dùng sẽ bị chặn truy cập. Tiến bộ và lịch sử học tập vẫn được giữ."}
          </p>
          <ErrorBox message={error} />
          <div>
            <button
              className="button"
              disabled={busy}
              onClick={() => update(confirm, { disabled: !confirm.disabled })}
            >
              {busy
                ? "Đang cập nhật…"
                : confirm.disabled
                  ? "Mở khóa tài khoản"
                  : "Khóa tài khoản"}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
