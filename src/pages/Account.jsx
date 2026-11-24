import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Check,
  Save,
  LoaderCircle,
  Palette,
  Heart,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCompanion } from "../context/AppearanceContext";
import {
  companions,
  themes,
  companionAsset,
} from "../../shared/personalization.js";
import { api } from "../lib/api";
import { Empty, ErrorBox, Spinner } from "../components/ui";

export default function Account() {
  const { user, demo, ready, profile, saveProfile, acceptProfile } = useApp();
  const { character } = useCompanion();
  const [displayName, setDisplayName] = useState(""),
    [nickname, setNickname] = useState(""),
    [companion, setCompanion] = useState("mimo"),
    [theme, setTheme] = useState("leaf"),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [preview, setPreview] = useState("");
  const fileInput = useRef(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setDisplayName(
      profile.displayName || user?.displayName || (demo ? "Bạn nhỏ" : ""),
    );
    setNickname(profile.nickname || "");
    setCompanion(profile.companion || "mimo");
    setTheme(profile.theme || "leaf");
  }, [
    profile.displayName,
    profile.nickname,
    profile.companion,
    profile.theme,
    user?.displayName,
    demo,
  ]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveProfile({
        displayName: displayName.trim(),
        nickname: nickname.trim(),
        companion,
        theme,
      });
      if (mounted.current)
        setNotice("Đã lưu! Không gian học của bạn đã khoác diện mạo mới.");
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function upload(file) {
    if (!file) return;
    setError("");
    setNotice("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Bạn chọn ảnh JPG, PNG hoặc WebP nhỏ hơn 5 MB nhé.");
      fileInput.current.value = "";
      return;
    }
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const signed = await api("/profile/avatar/signature", { method: "POST" });
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey);
      form.set("signature", signed.signature);
      for (const [key, value] of Object.entries(signed.params))
        form.set(key, String(value));
      const response = await fetch(signed.uploadUrl, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok)
        throw new Error("Chưa tải được ảnh lên Cloudinary. Bạn thử lại nhé.");
      const image = await response.json();
      const updated = await api("/profile/avatar", {
        method: "POST",
        body: {
          public_id: image.public_id,
          version: image.version,
          signature: image.signature,
        },
      });
      if (mounted.current) {
        acceptProfile(updated);
        setNotice("Đã cập nhật ảnh đại diện của bạn.");
      }
    } catch (e) {
      if (mounted.current)
        setError(e.message || "Chưa tải được ảnh. Bạn thử lại nhé.");
    } finally {
      if (mounted.current) {
        setUploading(false);
        setPreview("");
        if (fileInput.current) fileInput.current.value = "";
      }
    }
  }
  if (!ready) return <Spinner text="Đang mở góc của bạn…" />;
  if (!user && !demo)
    return (
      <div className="page-wrap">
        <Empty
          title="Một góc nhỏ dành riêng cho bạn"
          action={
            <Link className="button" to="/login" state={{ from: "/account" }}>
              Đăng nhập
            </Link>
          }
        >
          Đăng nhập để lưu tên, ảnh và chọn bạn đồng hành yêu thích.
        </Empty>
      </div>
    );
  const selected = companions.find((c) => c.id === companion) || companions[0];
  return (
    <div className="account-settings page-wrap">
      <header className="account-settings-heading">
        <div>
          <h1>Một góc nhỏ, thật là bạn.</h1>
          <p>Chọn người bạn đồng hành và những màu sắc khiến bạn mỉm cười.</p>
        </div>
        <img
          src={companionAsset(companion, "happy")}
          alt=""
          width={104}
          height={104}
        />
      </header>
      {demo && (
        <div className="preview-notice demo">
          Bạn đang chơi thử. Tên và lựa chọn lưu tạm; đăng nhập để lưu lâu dài
          và tải ảnh đại diện.
        </div>
      )}
      <ErrorBox message={error} />
      {notice && (
        <div className="success-notice" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <form onSubmit={save}>
        <section className="personal-details" aria-labelledby="personal-title">
          <div className="settings-section-intro">
            <h2 id="personal-title">Để mình làm quen nhé!</h2>
            <p>
              Tên để quản lý tài khoản; nickname là cách {character.name} gọi
              bạn.
            </p>
          </div>
          <div className="personal-form-layout">
            <div className="avatar-upload">
              <div className="profile-avatar-large">
                {preview || profile.avatarUrl ? (
                  <img
                    src={preview || profile.avatarUrl}
                    alt="Ảnh đại diện của bạn"
                  />
                ) : (
                  <span>
                    {(nickname || displayName || "B").slice(0, 1).toUpperCase()}
                  </span>
                )}
                {uploading && (
                  <span className="avatar-upload-progress">
                    <LoaderCircle className="spin" size={24} />
                  </span>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-label="Chọn ảnh đại diện"
                disabled={!user || uploading || busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <button
                type="button"
                className="button secondary"
                disabled={!user || uploading || busy}
                onClick={() => fileInput.current.click()}
              >
                <Camera size={17} />
                {uploading ? "Đang tải ảnh…" : "Đổi ảnh đại diện"}
              </button>
              <small>JPG, PNG, WebP · tối đa 5 MB</small>
            </div>
            <div className="personal-fields">
              <label>
                Tên của bạn
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={1}
                  maxLength={60}
                  autoComplete="name"
                  disabled={busy}
                />
              </label>
              <label>
                Nickname
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={30}
                  placeholder="Bạn muốn được gọi là gì?"
                  autoComplete="nickname"
                  disabled={busy}
                />
                <small>Để trống nickname nếu bạn muốn dùng tên của mình.</small>
              </label>
              <p className="account-settings-note">
                Bạn có thể thay đổi những lựa chọn này bất cứ lúc nào.
              </p>
            </div>
          </div>
        </section>
        <fieldset className="companion-choices" disabled={busy || uploading}>
          <legend>
            <Heart size={20} />
            Ai sẽ cùng bạn khám phá?
          </legend>
          <p>Mỗi người bạn đều có những biểu cảm và tư thế riêng.</p>
          <div className="companion-choice-grid">
            {companions.map((c) => (
              <label
                key={c.id}
                className={
                  "companion-choice " + (companion === c.id ? "selected" : "")
                }
              >
                <input
                  type="radio"
                  name="companion"
                  value={c.id}
                  checked={companion === c.id}
                  onChange={() => setCompanion(c.id)}
                />
                <span className="companion-choice-check" aria-hidden="true">
                  {companion === c.id && <Check size={17} />}
                </span>
                <img
                  src={companionAsset(c.id)}
                  alt=""
                  width={180}
                  height={180}
                  loading="lazy"
                />
                <strong>
                  {c.name}
                  <small>{c.species}</small>
                </strong>
                <span>{c.description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="theme-choices" disabled={busy || uploading}>
          <legend>
            <Palette size={20} />
            Màu sắc của riêng bạn
          </legend>
          <p>Màu chủ đạo sẽ theo bạn từ khám phá đến giải toán.</p>
          <div className="theme-choice-list">
            {themes.map((t) => (
              <label
                key={t.id}
                className={"theme-choice " + (theme === t.id ? "selected" : "")}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => setTheme(t.id)}
                />
                <span className="theme-swatch" style={{ background: t.color }}>
                  {theme === t.id && <Check size={18} />}
                </span>
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="personal-save">
          <p>
            Sẵn sàng cùng <strong>{selected.name}</strong> bắt đầu chuyến phiêu
            lưu?
          </p>
          <button
            className="button"
            disabled={busy || uploading || !displayName.trim()}
          >
            <Save size={18} />
            {busy ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
