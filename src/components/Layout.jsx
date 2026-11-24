import React, { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  Compass,
  Map,
  Award,
  History,
  LogOut,
  Settings2,
  UserRound,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Sprout,
  Flame,
  BookOpen,
  School,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getLevel } from "../../shared/catalog";
import { Mascot } from "./ui";
import useDialog from "../hooks/useDialog";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Mathate, về khám phá">
      <img src="/favicon.svg" alt="" />
      <span>
        mathate<span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
import { useCompanion } from "../context/AppearanceContext";
const links = [
  { path: "/", icon: Compass, label: "Khám phá" },
  { path: "/classes", icon: School, label: "Lớp của mình" },
  { path: "/journey", icon: Map, label: "Hành trình của mình" },
  { path: "/collection", icon: Award, label: "Bộ sưu tập" },
  { path: "/history", icon: History, label: "Góc ôn tập" },
  { path: "/account", icon: UserRound, label: "Tài khoản của mình" },
];
export default function Layout() {
  const { copy } = useCompanion();
  const { user, demo, profile, logout } = useApp();
  const isTeacher = user?.role === "teacher";
  const navigation = isTeacher
    ? [
        { path: "/teacher", icon: School, label: "Lớp đang dạy" },
        { path: "/account", icon: UserRound, label: "Tài khoản của mình" },
      ]
    : links;
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const [mobile, setMobile] = useState(
    window.matchMedia("(max-width:760px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width:760px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  useDialog(menu && mobile, ".sidebar", () => setMenu(false));
  const current = location.pathname.startsWith("/practice")
    ? "Cùng Mimo giải toán"
    : location.pathname.startsWith("/teacher")
      ? "Không gian giáo viên"
      : location.pathname.startsWith("/classes")
        ? "Lớp của mình"
        : navigation.find((l) => l.path === location.pathname)?.label ||
          "Quản trị Mathate";
  const level = getLevel(profile.xp),
    name =
      profile.nickname ||
      (profile.displayName || user?.displayName)?.split(" ").at(-1) ||
      (demo ? "Bạn nhỏ" : "Bạn nhỏ");
  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${menu ? "is-open" : ""}`}
        inert={mobile && !menu ? "" : undefined}
        aria-hidden={mobile && !menu ? true : undefined}
      >
        <div className="sidebar-head">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={() => setMenu(false)}
            aria-label="Đóng menu"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setMenu(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={21} />
              <span>{label}</span>
              {path === "/collection" && profile.badges?.length > 0 && (
                <span className="nav-count">{profile.badges.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-invitation">
          <div className="mini-mascot">
            <Mascot />
          </div>
          <strong>
            {isTeacher ? "Mỗi lớp học," : "Một chút mỗi ngày,"}
            <br />
            {isTeacher ? "một vườn khám phá." : "giỏi hơn thật nhiều!"}
          </strong>
          <p>{copy("Mimo luôn ở đây cùng bạn.")}</p>
          <Link
            to={isTeacher ? "/teacher" : "/journey"}
            onClick={() => setMenu(false)}
          >
            {isTeacher ? "Về lớp đang dạy" : "Xem hành trình"}{" "}
            <ChevronRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          {user?.admin && (
            <NavLink
              to="/admin"
              className="nav-link"
              onClick={() => setMenu(false)}
            >
              <Settings2 size={20} />
              Quản trị Mathate
            </NavLink>
          )}
          {user || demo ? (
            <button className="nav-link" onClick={logout}>
              <LogOut size={20} />
              {demo ? "Rời trải nghiệm" : "Đăng xuất"}
            </button>
          ) : (
            <Link to="/login" className="nav-link">
              <LogOut size={20} />
              Đăng nhập
            </Link>
          )}
          <p>Được tạo nên cho những trí tò mò.</p>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Mở menu"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span>Không gian học tập</span>
            <ChevronRight size={16} />
            <strong>{copy(current)}</strong>
          </div>
          <div className="topbar-right">
            {!isTeacher && (
              <span className="streak-chip" title="Số ngày học liên tiếp">
                <Flame size={18} />
                <b>{profile.streak}</b>
                <span>ngày</span>
              </span>
            )}
            {!user && !demo ? (
              <Link className="button button-small" to="/login">
                Đăng nhập
              </Link>
            ) : (
              <Link
                className="account-chip"
                aria-label="Tài khoản của mình"
                to="/account"
              >
                <span className="avatar">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="user-avatar-image"
                    />
                  ) : (
                    <Sprout size={23} />
                  )}
                </span>
                <span>
                  <strong>{name}</strong>
                  <small>
                    {isTeacher
                      ? "Giáo viên"
                      : `Cấp ${level.number} · ${level.name}`}
                  </small>
                </span>
              </Link>
            )}
          </div>
        </header>
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>
            <BookOpen size={15} /> Mỗi ngày một khám phá, mỗi bài toán một niềm
            vui.
          </span>
          <span>
            Mathate <Sparkles size={14} />
          </span>
        </footer>
      </div>
    </div>
  );
}
