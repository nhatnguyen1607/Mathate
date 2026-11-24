import { useCompanion } from "../context/AppearanceContext";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getIdTokenResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Sparkles, Eye, EyeOff, ChevronLeft, Check, Mail } from "lucide-react";
import { auth } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import { Logo } from "../components/Layout";
import { ErrorBox } from "../components/ui";
import LoginMascots from "../components/LoginMascots";
import { accountRole } from "../../shared/roles";
const messages = {
  "auth/user-disabled":
    "Tài khoản đã bị khóa. Bạn liên hệ quản trị viên để được hỗ trợ nhé.",
  "auth/invalid-credential":
    "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.",
  "auth/invalid-email": "Email chưa đúng định dạng.",
  "auth/email-already-in-use":
    "Email này đã có tài khoản. Bạn chọn đăng nhập nhé.",
  "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
  "auth/operation-not-allowed":
    "Phương thức đăng nhập chưa được bật trong Firebase Console.",
  "auth/unauthorized-domain":
    "Tên miền hiện tại chưa được thêm vào Firebase Authentication.",
  "auth/popup-closed-by-user": "Cửa sổ đăng nhập đã đóng. Bạn có thể thử lại.",
  "auth/too-many-requests":
    "Có nhiều lần thử liên tiếp. Bạn đợi một chút rồi thử lại nhé.",
  "auth/network-request-failed":
    "Kết nối chưa ổn định. Bạn kiểm tra mạng rồi thử lại.",
  "auth/configuration-not-found":
    "Firebase Authentication chưa được bật cho dự án Mathate.",
};
export default function Login() {
  const { copy } = useCompanion();
  const [register, setRegister] = useState(false),
    [show, setShow] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const { health, enterDemo } = useApp(),
    navigate = useNavigate(),
    location = useLocation();
  const destination =
    location.state?.from?.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/";
  async function run(action) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      const token = await getIdTokenResult(auth.currentUser, true);
      const role = accountRole(token.claims);
      navigate(
        role === "admin"
          ? "/admin"
          : role === "teacher"
            ? "/teacher"
            : destination,
        {
          replace: true,
        },
      );
    } catch (e) {
      setError(messages[e.code] || "Chưa đăng nhập được. Bạn thử lại sau nhé.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    run(async () => {
      if (register) {
        const r = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(r.user, {
          displayName: name.trim() || "Bạn nhỏ",
        });
      } else await signInWithEmailAndPassword(auth, email, password);
    });
  }
  async function reset() {
    if (!email.trim()) {
      setError("Nhập email của bạn trước khi lấy lại mật khẩu nhé.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice(
        "Nếu email có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
      );
    } catch (e) {
      setError(messages[e.code] || "Chưa gửi được email. Bạn thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-world login-world-group">
        <Logo />
        <div className="login-world-copy">
          <h1>
            Những điều lớn lao
            <br />
            bắt đầu từ một
            <br />
            <span>chút tò mò.</span>
          </h1>
          <p>
            {copy("\n            Cùng khám phá toán học\n            ")}
            <br />
            theo cách thật vui, thật là bạn.
          </p>
        </div>
        <LoginMascots />
        <span className="login-spark">
          <Sparkles size={38} />
        </span>
        <div className="login-world-footer">
          <Check size={18} /> Không áp lực. Không ngại sai. Chỉ cần thử.
        </div>
      </section>
      <main id="main-content" className="login-main">
        <Link to="/" className="back-link">
          <ChevronLeft size={17} />
          Về khám phá
        </Link>
        <div className="login-form-wrap">
          <span className="login-welcome-icon">
            <Sparkles size={25} />
          </span>
          <h2>
            {register ? "Bắt đầu hành trình nhỏ" : copy("Mimo chờ bạn mãi!")}
          </h2>
          <p>
            {register
              ? "Nhờ bố mẹ cùng tạo tài khoản để lưu tiến bộ nhé."
              : "Đăng nhập để tiếp nối những khám phá của bạn."}
          </p>
          <button
            className="google-button"
            disabled={busy}
            onClick={() =>
              run(() => signInWithPopup(auth, new GoogleAuthProvider()))
            }
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="#4285f4"
                d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.61 4.61 0 0 1-2 3.03v2.52h3.24c1.89-1.74 2.98-4.3 2.98-7.38Z"
              />
              <path
                fill="#34a853"
                d="M12 22c2.7 0 4.96-.9 6.62-2.39l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#fbbc05"
                d="M6.42 13.93a6 6 0 0 1 0-3.86v-2.6H3.08a10 10 0 0 0 0 9.06l3.34-2.6Z"
              />
              <path
                fill="#ea4335"
                d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.86-2.87A9.59 9.59 0 0 0 12 2a10 10 0 0 0-8.92 5.47l3.34 2.6A6 6 0 0 1 12 5.95Z"
              />
            </svg>
            Tiếp tục với Google
          </button>
          <div className="form-divider">
            <span />
            hoặc dùng email
            <span />
          </div>
          <form onSubmit={submit}>
            {register && (
              <label>
                {copy(
                  "\n                Bạn muốn Mimo gọi là gì?\n                ",
                )}
                <input
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  placeholder="Tên thân mật của bạn"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn hoặc bố mẹ"
                required
                maxLength={254}
              />
            </label>
            <label>
              Mật khẩu
              <span className="password-input">
                <input
                  type={show ? "text" : "password"}
                  minLength={6}
                  autoComplete={register ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {!register && (
              <button
                type="button"
                className="forgot-password"
                disabled={busy}
                onClick={reset}
              >
                Quên mật khẩu?
              </button>
            )}
            <ErrorBox message={error} />
            {notice && (
              <p className="success-notice" role="status">
                <Mail size={18} />
                {notice}
              </p>
            )}
            <button className="button wide" disabled={busy}>
              {busy
                ? "Đang kết nối…"
                : register
                  ? copy("Tạo tài khoản cùng Mimo")
                  : "Vào thế giới Mathate"}
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Lần đầu ghé Mathate?"}{" "}
            <button
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
                setNotice("");
              }}
            >
              {register ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </p>
          {health?.demoEnabled && (
            <button
              className="demo-login"
              disabled={busy}
              onClick={() => {
                enterDemo();
                navigate("/");
              }}
            >
              Mình muốn chơi thử trước
            </button>
          )}
          <p className="parent-note">
            Dành cho bạn nhỏ 6–11 tuổi. Bố mẹ hãy đồng hành khi tạo tài khoản và
            sử dụng AI nhé.
          </p>
        </div>
      </main>
    </div>
  );
}
