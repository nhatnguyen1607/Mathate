import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ShieldCheck,
  Search,
  Database,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { TopicIcon, ErrorBox, Empty } from "../components/ui";
import useDialog from "../hooks/useDialog";
const blank = {
  name: "",
  description: "",
  category: "numbers",
  color: "green",
  icon: "calculator",
  promptType: "general",
  promptGuidance: "",
  active: true,
  order: 0,
};
export default function Admin() {
  const { user, topics, refresh, error, health } = useApp();
  const [editing, setEditing] = useState(null),
    [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [localError, setLocalError] = useState(""),
    [deleting, setDeleting] = useState(null),
    [notice, setNotice] = useState("");
  useDialog(!!deleting, ".delete-confirm", () => setDeleting(null), busy);
  const change = (e) =>
    setForm((old) => ({
      ...old,
      [e.target.name]:
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.name === "order"
            ? Number(e.target.value)
            : e.target.value,
    }));
  const edit = (topic) => {
    setEditing(topic?.id || "new");
    setForm(
      topic
        ? Object.fromEntries(
            Object.keys(blank).map((key) => [key, topic[key] ?? blank[key]]),
          )
        : blank,
    );
    setLocalError("");
    setNotice("");
  };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      await api(editing === "new" ? "/topics" : `/topics/${editing}`, {
        method: editing === "new" ? "POST" : "PUT",
        body: form,
      });
      setEditing(null);
      await refresh();
      setNotice("Đã lưu chủ đề. Dashboard sẽ dùng nội dung mới.");
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setLocalError("");
    try {
      await api(`/topics/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await refresh();
      setNotice("Đã xóa chủ đề. Các bài học cũ vẫn được giữ nguyên.");
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function seed() {
    setBusy(true);
    setLocalError("");
    try {
      await api("/topics/seed", { method: "POST" });
      await refresh();
      setNotice("Đã thêm các chủ đề mẫu còn thiếu.");
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user?.admin)
    return (
      <div className="page-wrap">
        <Empty
          title="Khu vực dành cho quản trị viên"
          action={
            <Link className="button" to="/login" state={{ from: "/admin" }}>
              Đăng nhập quản trị
            </Link>
          }
        >
          Tài khoản cần được cấp quyền admin từ máy chủ để quản lý chủ đề.
        </Empty>
      </div>
    );
  return (
    <div className="page-wrap">
      <div className="page-heading admin-heading">
        <div>
          <h1>Vườn chủ đề Mathate</h1>
          <p>Chăm chút những khám phá dành cho các bạn nhỏ.</p>
        </div>
        <button className="button" onClick={() => edit()}>
          <Plus size={18} />
          Thêm chủ đề
        </button>
      </div>
      <ErrorBox message={localError || error} />
      {notice && (
        <div className="success-notice" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {!health?.persistenceReady && (
        <ErrorBox message="Cần cấu hình Firebase Admin trước khi lưu chủ đề." />
      )}
      {editing ? (
        <section className="admin-editor">
          <div className="section-heading">
            <h2>
              {editing === "new" ? "Thêm chủ đề mới" : "Chỉnh sửa chủ đề"}
            </h2>
            <button
              className="icon-button"
              aria-label="Đóng chỉnh sửa"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              <label>
                Tên chủ đề
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                Nhóm chủ đề
                <select name="category" value={form.category} onChange={change}>
                  <option value="numbers">Số & phép tính</option>
                  <option value="geometry">Hình học</option>
                  <option value="life">Toán trong cuộc sống</option>
                </select>
              </label>
              <label className="span-two">
                Mô tả cho bạn nhỏ
                <input
                  name="description"
                  value={form.description}
                  onChange={change}
                  minLength={5}
                  maxLength={200}
                  required
                />
              </label>
              <label>
                Biểu tượng
                <select name="icon" value={form.icon} onChange={change}>
                  {[
                    ["calculator", "Máy tính"],
                    ["shapes", "Hình học"],
                    ["pie", "Phân số"],
                    ["ruler", "Thước đo"],
                    ["percent", "Phần trăm"],
                    ["rocket", "Chuyển động"],
                  ].map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Màu chủ đề
                <select name="color" value={form.color} onChange={change}>
                  {[
                    ["green", "Xanh lá"],
                    ["purple", "Tím"],
                    ["orange", "Cam"],
                    ["blue", "Xanh dương"],
                    ["pink", "Hồng"],
                    ["yellow", "Vàng"],
                  ].map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bộ prompt kế thừa
                <select
                  name="promptType"
                  value={form.promptType}
                  onChange={change}
                >
                  <option value="general">Toán tổng quát</option>
                  <option value="decimal">Số thập phân</option>
                  <option value="ratio">Tỉ số & phần trăm</option>
                  <option value="velocity">Thời gian & chuyển động</option>
                </select>
              </label>
              <label>
                Thứ tự hiển thị
                <input
                  type="number"
                  name="order"
                  min={0}
                  max={1000}
                  value={form.order}
                  onChange={change}
                />
              </label>
              <label className="span-two">
                Hướng dẫn tạo đề
                <textarea
                  name="promptGuidance"
                  rows={5}
                  value={form.promptGuidance}
                  onChange={change}
                  minLength={10}
                  maxLength={2000}
                  required
                  placeholder="Mô tả kiến thức, giới hạn số liệu, yêu cầu cho từng độ khó…"
                />
                <small>
                  Hướng dẫn này bổ sung vào prompt gốc, chỉ hiển thị cho quản
                  trị viên.
                </small>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={change}
                />
                Mở chủ đề cho học sinh
              </label>
            </div>
            <div className="editor-actions">
              <button className="button" disabled={busy}>
                <Save size={18} />
                {busy ? "Đang lưu…" : "Lưu chủ đề"}
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
        </section>
      ) : topics.length ? (
        <div className="admin-list">
          {topics.map((t) => (
            <div className="admin-row" key={t.id}>
              <span className={`topic-icon ${t.color}`}>
                <TopicIcon name={t.icon} />
              </span>
              <div>
                <h2>{t.name}</h2>
                <p>{t.description}</p>
              </div>
              <span className={`admin-visibility ${t.active ? "" : "hidden"}`}>
                {t.active ? <Eye size={16} /> : <EyeOff size={16} />}{" "}
                {t.active ? "Đang mở" : "Đang ẩn"}
              </span>
              <button
                className="icon-button"
                aria-label={`Sửa ${t.name}`}
                onClick={() => edit(t)}
              >
                <Pencil size={18} />
              </button>
              <button
                className="icon-button danger"
                aria-label={`Xóa ${t.name}`}
                onClick={() => {
                  setDeleting(t);
                  setLocalError("");
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="Khu vườn chưa có chủ đề">
          Thêm chủ đề đầu tiên hoặc dùng các chủ đề mẫu để bắt đầu.
        </Empty>
      )}
      {!editing && (
        <button
          className="button secondary seed-button"
          disabled={busy}
          onClick={seed}
        >
          <Database size={18} />
          Thêm các chủ đề mẫu còn thiếu
        </button>
      )}
      {deleting && (
        <div
          className="delete-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <h2 id="delete-title">Xóa “{deleting.name}”?</h2>
          <p>
            Chủ đề sẽ biến mất khỏi dashboard. Lịch sử bài học của người dùng
            vẫn được giữ.
          </p>
          <div>
            <button
              className="button danger-button"
              onClick={remove}
              disabled={busy}
            >
              {busy ? "Đang xóa…" : "Xóa chủ đề"}
            </button>
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Giữ lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
