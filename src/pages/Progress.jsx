import { useCompanion } from "../context/AppearanceContext";
import React from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Star,
  Check,
  LockKeyhole,
  Flame,
  BookOpen,
  ChevronRight,
  Search,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { levels, getLevel, difficulties } from "../../shared/catalog";
import { Empty, TopicIcon, ErrorBox, Spinner } from "../components/ui";
export function Journey() {
  const { profile, error, refresh, demo } = useApp();
  const current = getLevel(profile.xp);
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1>Hành trình của mình</h1>
        <p>Mỗi bước nhỏ hôm nay là một điều tuyệt vời.</p>
      </div>
      {demo && (
        <div className="preview-notice demo">
          Điểm trải nghiệm chỉ lưu tạm trong phiên máy chủ.
        </div>
      )}
      <ErrorBox message={error} retry={refresh} />
      <section className="journey-summary">
        <div className="journey-sprout">
          <Sprout size={50} />
        </div>
        <div>
          <h2>{current.name}</h2>
          <p>
            Cấp {current.number} · {profile.xp} XP đã tích lũy
          </p>
        </div>
        <div className="journey-summary-stat">
          <BookOpen />
          <strong>{profile.solved}</strong>
          <span>bài đã giải</span>
        </div>
        <div className="journey-summary-stat">
          <Flame />
          <strong>{profile.streak}</strong>
          <span>ngày liên tiếp</span>
        </div>
      </section>
      <section className="milestones">
        <h2>Những cột mốc đang chờ bạn</h2>
        <ol>
          {levels.map((level, index) => (
            <li
              className={profile.xp >= level.min ? "unlocked" : ""}
              key={level.name}
            >
              <div className="milestone-icon">
                {profile.xp >= level.min ? (
                  index === 0 ? (
                    <Sprout />
                  ) : (
                    <Star />
                  )
                ) : (
                  <LockKeyhole size={21} />
                )}
              </div>
              <div>
                <span>
                  Cấp {index + 1} · {level.min} XP
                </span>
                <h3>{level.name}</h3>
                <p>
                  {profile.xp >= level.min
                    ? current.number === index + 1
                      ? "Bạn đang ở đây. Cứ tò mò thêm một chút nhé!"
                      : "Một cột mốc bạn đã chinh phục!"
                    : `Còn ${level.min - profile.xp} XP để khám phá cột mốc này.`}
                </p>
              </div>
              {current.number === index + 1 && (
                <span className="current-level">Hiện tại</span>
              )}
            </li>
          ))}
        </ol>
        <Link className="button" to="/">
          Khám phá một bài toán mới
        </Link>
      </section>
    </div>
  );
}
export { default as Collection } from "./Collection";
export function HistoryPage() {
  const { copy } = useCompanion();
  const { history, loading, error, refresh } = useApp();
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1>Góc ôn tập</h1>
        <p>Ghé lại những bài đã học, hoặc tiếp tục điều còn dang dở.</p>
      </div>
      <ErrorBox message={error} retry={refresh} />
      {loading ? (
        <Spinner />
      ) : history.length ? (
        <div className="history-list">
          {history.map((s) => (
            <Link to={`/practice/${s.id}`} className="history-row" key={s.id}>
              <span className={`topic-icon ${s.topic.color}`}>
                <TopicIcon name={s.topic.icon} />
              </span>
              <div>
                <h2>{copy(s.title)}</h2>
                <p>
                  {s.topic.name} · {difficulties[s.difficulty].label} ·{" "}
                  {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                    timeZone: "Asia/Bangkok",
                  })}
                </p>
              </div>
              <span
                className={`session-state ${s.completed ? "complete" : ""}`}
              >
                {s.completed ? (
                  <>
                    <Check size={16} />+{s.xp} XP
                  </>
                ) : (
                  `Bước ${s.step}/4`
                )}
              </span>
              <ChevronRight size={20} />
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Những khám phá đang chờ bạn"
          action={
            <Link className="button" to="/">
              Chọn bài toán đầu tiên
            </Link>
          }
        >
          {copy(
            "\n          Mỗi bài học cùng Mimo sẽ xuất hiện ở đây để bạn có thể ghé lại bất cứ\n          lúc nào.\n        ",
          )}
        </Empty>
      )}
    </div>
  );
}
