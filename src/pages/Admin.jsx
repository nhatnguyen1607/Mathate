import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users, Sprout, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Empty, Spinner } from "../components/ui";
import TopicManager from "./TopicManager";
import Accounts from "./Accounts";
import "../admin.css";

export function AdminWorkspace({ tab, onTab, children }) {
  return (
    <div className="admin-workspace page-wrap">
      <header className="admin-intro">
        <div>
          <h1>Chăm chút Mathate mỗi ngày.</h1>
          <p>Quản lý tài khoản và những chủ đề nuôi dưỡng trí tò mò.</p>
        </div>
        <Link className="button secondary" to="/">
          Xem không gian học <ArrowUpRight size={17} />
        </Link>
      </header>
      <div className="admin-navigation">
        <nav aria-label="Các mục quản trị">
          <button
            className={tab === "accounts" ? "selected" : ""}
            aria-current={tab === "accounts" ? "page" : undefined}
            onClick={() => onTab("accounts")}
          >
            <Users size={19} />
            Tài khoản
          </button>
          <button
            className={tab === "topics" ? "selected" : ""}
            aria-current={tab === "topics" ? "page" : undefined}
            onClick={() => onTab("topics")}
          >
            <Sprout size={19} />
            Chủ đề
          </button>
        </nav>
        <span>
          <ShieldCheck size={16} />
          Không gian quản trị
        </span>
      </div>
      <div className="admin-content">{children}</div>
    </div>
  );
}
export default function Admin() {
  const { user, ready } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "topics" ? "topics" : "accounts";
  if (!ready) return <Spinner text="Đang kiểm tra quyền quản trị…" />;
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
          Tài khoản cần được cấp quyền admin để tiếp tục.
        </Empty>
      </div>
    );
  return (
    <AdminWorkspace tab={tab} onTab={(value) => setParams({ tab: value })}>
      {tab === "accounts" ? <Accounts actorUid={user.uid} /> : <TopicManager />}
    </AdminWorkspace>
  );
}
