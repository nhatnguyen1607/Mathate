import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  Flame,
  Flower2,
  Heart,
  LockKeyhole,
  Map,
  Medal,
  Pencil,
  Rocket,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Trophy,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Empty, ErrorBox, Spinner } from "../components/ui";
import { badges, badgeGroups, badgeProgress } from "../../shared/achievements";
import "../collection.css";

const icons = {
  sprout: Sprout,
  star: Star,
  book: BookOpen,
  medal: Medal,
  trophy: Trophy,
  pencil: Pencil,
  flame: Flame,
  sun: Sun,
  calendar: CalendarDays,
  flower: Flower2,
  sparkles: Sparkles,
  rocket: Rocket,
  compass: Compass,
  map: Map,
  heart: Heart,
};
const format = (number) => number.toLocaleString("vi-VN");

export default function Collection() {
  const { user, demo, ready, profile, loading, error, refresh } = useApp();
  const [group, setGroup] = useState("all"),
    [status, setStatus] = useState("all");
  const medals = useMemo(
    () =>
      badges.map((badge) => ({ ...badge, ...badgeProgress(badge, profile) })),
    [profile],
  );
  const earned = medals.filter((badge) => badge.earned).length;
  const visible = medals.filter(
    (badge) =>
      (group === "all" || badge.group === group) &&
      (status === "all" ||
        (status === "earned" ? badge.earned : !badge.earned)),
  );
  return (
    <div className="page-wrap collection-page">
      <div className="page-heading collection-heading">
        <div>
          <h1>Bộ sưu tập bé xinh</h1>
          <p>Những dấu ấn cho từng lần bạn thử sức.</p>
        </div>
        {ready && (user || demo) && (
          <span className="collection-total">
            <Award size={24} />
            <strong>
              {earned}/{badges.length}
            </strong>{" "}
            huy chương đã nhận
          </span>
        )}
      </div>
      <ErrorBox message={error} retry={refresh} />
      {!ready || loading ? (
        <Spinner text="Đang mở bộ sưu tập…" />
      ) : !user && !demo ? (
        <Empty
          title="Những huy chương đang chờ bạn"
          action={
            <Link
              className="button"
              to="/login"
              state={{ from: "/collection" }}
            >
              Đăng nhập để sưu tập
            </Link>
          }
        >
          Đăng nhập để lưu từng bài đã giải và những cột mốc của riêng mình nhé.
        </Empty>
      ) : (
        <>
          {demo && (
            <p className="preview-notice demo">
              Bạn đang chơi thử. Huy chương chỉ lưu tạm trong phiên máy chủ.
            </p>
          )}
          <div className="collection-tools">
            <div
              className="collection-filters"
              role="group"
              aria-label="Nhóm huy chương"
            >
              <button
                className={group === "all" ? "is-selected" : ""}
                aria-pressed={group === "all"}
                onClick={() => setGroup("all")}
              >
                Tất cả <span>{badges.length}</span>
              </button>
              {badgeGroups.map((item) => {
                const Icon = icons[item.icon];
                return (
                  <button
                    key={item.id}
                    className={group === item.id ? "is-selected" : ""}
                    aria-pressed={group === item.id}
                    onClick={() => setGroup(item.id)}
                  >
                    <Icon size={17} />
                    {item.name}
                  </button>
                );
              })}
            </div>
            <label
              className="collection-status"
              htmlFor="collection-status-filter"
            >
              Hiển thị
              <select
                id="collection-status-filter"
                aria-label="Trạng thái huy chương"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="earned">Đã nhận</option>
                <option value="locked">Đang khám phá</option>
              </select>
            </label>
          </div>
          <div className="collection-caption">
            <p role="status" aria-live="polite">
              {visible.length} huy chương
              {group !== "all"
                ? ` · ${badgeGroups.find((item) => item.id === group).name}`
                : " cho những nỗ lực nhỏ mỗi ngày"}
            </p>
            <span>Đã nhận rồi sẽ luôn là của bạn.</span>
          </div>
          {visible.length ? (
            <div className="collection-medals">
              {visible.map((badge) => {
                const Icon = icons[badge.icon];
                return (
                  <article
                    className={`collection-medal ${badge.earned ? "is-earned" : "is-locked"}`}
                    key={badge.id}
                  >
                    <div className="collection-medal-main">
                      <div
                        className={`collection-medal-art ${badge.color}`}
                        aria-hidden="true"
                      >
                        <Icon size={36} strokeWidth={1.7} />
                      </div>
                      <div>
                        <h2>{badge.name}</h2>
                        <p>{badge.description}</p>
                      </div>
                    </div>
                    <div className="collection-medal-state">
                      <span>
                        {badge.earned ? (
                          <>
                            <Check size={15} />
                            Đã nhận
                          </>
                        ) : (
                          <>
                            <LockKeyhole size={14} />
                            Đang khám phá
                          </>
                        )}
                      </span>
                      <strong>
                        {format(badge.value)}/{format(badge.target)}{" "}
                        <span>{badge.unit}</span>
                      </strong>
                    </div>
                    <progress
                      value={badge.value}
                      max={badge.target}
                      aria-label={`${badge.name}: ${badge.value} trên ${badge.target} ${badge.unit}`}
                    />
                    <p className="collection-medal-hint">
                      {badge.earned
                        ? "Một dấu ấn đáng nhớ trong hành trình của bạn."
                        : `Thêm ${format(badge.remaining)} ${badge.unit} để đón huy chương này.`}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title={
                status === "earned"
                  ? earned
                    ? "Nhóm này đang chờ dấu ấn đầu tiên!"
                    : "Huy chương đầu tiên đang chờ mình!"
                  : earned === badges.length
                    ? `Bộ sưu tập đã có đủ ${badges.length} dấu ấn!`
                    : "Bạn đã sưu tập đủ nhóm này rồi!"
              }
              action={
                <button
                  className="button secondary"
                  onClick={() => {
                    setGroup("all");
                    setStatus("all");
                  }}
                >
                  Xem tất cả huy chương
                </button>
              }
            >
              {status === "earned"
                ? "Mỗi bài toán hoàn thành đều đưa bạn đến gần một cột mốc mới."
                : earned === badges.length
                  ? "Những nỗ lực đã được ghi lại. Mình cùng tiếp tục tìm niềm vui trong toán học nhé."
                  : "Ghé những nhóm còn lại để tìm thêm một khám phá mới nhé."}
            </Empty>
          )}
          <div className="gentle-note">
            <Star />
            <p>
              Huy chương ghi lại nỗ lực của bạn.
              <br />
              <strong>Không cần so sánh với ai, chỉ cần vui cùng toán!</strong>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
