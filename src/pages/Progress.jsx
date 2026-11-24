import React from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Compass,
  Star,
  Award,
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
const badges = [
  {
    id: "first-step",
    icon: Sprout,
    name: "Bước chân đầu tiên",
    description: "Hoàn thành bài toán đầu tiên.",
    color: "green",
  },
  {
    id: "five-problems",
    icon: Star,
    name: "Ngôi sao chăm chỉ",
    description: "Tự giải và kiểm tra 5 bài toán.",
    color: "yellow",
  },
  {
    id: "explorer",
    icon: Compass,
    name: "Trí tò mò không giới hạn",
    description: "Hoàn thành bài ở 3 chủ đề khác nhau.",
    color: "purple",
  },
];
export function Collection() {
  const { profile, error, refresh } = useApp();
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1>Bộ sưu tập bé xinh</h1>
        <p>Những dấu ấn cho từng lần bạn thử sức.</p>
      </div>
      <ErrorBox message={error} retry={refresh} />
      <div className="collection-header">
        <Award size={25} />
        <strong>
          {profile.badges?.length || 0}/{badges.length} huy hiệu
        </strong>
        <span>Học vui, sưu tập những điều đáng nhớ.</span>
      </div>
      <div className="badge-grid">
        {badges.map(({ id, icon: Icon, name, description, color }) => {
          const earned = profile.badges?.includes(id);
          return (
            <article
              key={id}
              className={`badge-card ${earned ? "earned" : "locked"}`}
            >
              <div className={`badge-art ${color}`}>
                <Icon size={58} strokeWidth={1.5} />
                <span>
                  {earned ? <Check size={15} /> : <LockKeyhole size={15} />}
                </span>
              </div>
              <h2>{name}</h2>
              <p>{description}</p>
              <strong>
                {earned ? "Đã nằm trong bộ sưu tập!" : "Đang chờ bạn khám phá"}
              </strong>
            </article>
          );
        })}
      </div>
      <div className="gentle-note">
        <Star />
        <p>
          Huy hiệu ghi lại nỗ lực của bạn.
          <br />
          <strong>Không cần so sánh với ai, chỉ cần vui cùng toán!</strong>
        </p>
      </div>
    </div>
  );
}
export function HistoryPage() {
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
                <h2>{s.title}</h2>
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
          Mỗi bài học cùng Mimo sẽ xuất hiện ở đây để bạn có thể ghé lại bất cứ
          lúc nào.
        </Empty>
      )}
    </div>
  );
}
