import { useCompanion } from "../context/AppearanceContext";
import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Sparkles,
  Star,
  ChevronRight,
  Leaf,
  Check,
  X,
  Flame,
  Sprout,
  BookOpen,
  Lightbulb,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { difficulties, getLevel } from "../../shared/catalog";
import { api } from "../lib/api";
import { TopicIcon, ErrorBox, Spinner } from "../components/ui";
import HeroMimo from "../components/HeroMimo";
import useDialog from "../hooks/useDialog";
const categories = [
  {
    id: "all",
    label: "Tất cả chủ đề",
  },
  {
    id: "numbers",
    label: "Số & phép tính",
  },
  {
    id: "geometry",
    label: "Hình học",
  },
  {
    id: "life",
    label: "Toán trong cuộc sống",
  },
];
const facts = [
  "Ong xây tổ thành những hình lục giác. Hình học có mặt cả trong thiên nhiên đấy!",
  "Một phần hai cũng chính là 0,5 và 50%. Ba cách viết, cùng một giá trị!",
  "Số 0 là số tự nhiên duy nhất không dương và cũng không âm. Thú vị nhỉ?",
];
export default function Dashboard() {
  const { copy } = useCompanion();
  const {
    user,
    demo,
    profile,
    topics,
    history,
    error,
    loading,
    health,
    enterDemo,
    refresh,
  } = useApp();
  const [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [difficulty, setDifficulty] = useState("easy"),
    [creating, setCreating] = useState(false),
    [createError, setCreateError] = useState(""),
    [fact, setFact] = useState(0);
  const sectionRef = useRef(null),
    navigate = useNavigate(),
    level = getLevel(profile.xp);
  useDialog(
    !!selected,
    ".difficulty-dialog",
    () => setSelected(null),
    creating,
  );
  const visible = topics.filter(
    (t) =>
      t.active &&
      (category === "all" || t.category === category) &&
      t.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")),
  );
  const unfinished = history.find((s) => !s.completed);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const todaySolved = history.filter(
    (s) =>
      s.completed &&
      s.completedAt &&
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(s.completedAt)) === today,
  ).length;
  async function create() {
    if (!user && !demo) {
      navigate("/login", {
        state: {
          from: "/",
        },
      });
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const session = await api("/sessions", {
        method: "POST",
        body: {
          topicId: selected.id,
          difficulty,
        },
      });
      await refresh();
      navigate(`/practice/${session.id}`);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }
  return (
    <div className="dashboard page-wrap">
      <div className="greeting">
        <div>
          <h1>
            Chào{" "}
            {profile.nickname ||
              (profile.displayName || user?.displayName)?.split(" ").at(-1) ||
              "bạn nhỏ"}
            <span className="greeting-spark">
              <Sparkles size={26} />
            </span>
          </h1>
          <p>Một ngày tuyệt vời để khám phá những điều mới!</p>
        </div>
        <div className="date-note">
          <Leaf size={17} /> Lớn lên cùng những điều nhỏ bé
        </div>
      </div>
      {!user && (
        <div className={`preview-notice ${demo ? "demo" : ""}`}>
          <span>
            {demo
              ? "Bạn đang chơi thử · Bài mẫu có sẵn, điểm trải nghiệm lưu tạm trong phiên máy chủ."
              : copy(
                  "Ghé chơi cùng Mimo! Đăng nhập để lưu lại từng bước tiến của bạn.",
                )}
          </span>
          {!demo && health?.demoEnabled && (
            <button onClick={enterDemo}>
              Chơi thử <ChevronRight size={15} />
            </button>
          )}
          {demo && <Link to="/login">Lưu hành trình</Link>}
        </div>
      )}
      <ErrorBox message={error} retry={refresh} />
      <div className="dashboard-columns">
        <div className="discovery-column">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <h2>
                Mỗi bài toán,
                <br />
                một chuyến <span>phiêu lưu!</span>
              </h2>
              <p>
                {copy(
                  "\n                Cùng Mimo nuôi dưỡng trí tò mò\n                ",
                )}
                <br className="desktop-only" /> và tìm niềm vui trong thế giới
                toán học.
              </p>
              <button
                className="button"
                onClick={() =>
                  sectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                <CompassIcon />
                Khám phá ngay
              </button>
              <div className="banner-note">
                <Check size={15} /> Học theo cách của bạn, từng bước một.
              </div>
            </div>
            <HeroMimo />
          </section>
          {unfinished && (
            <Link to={`/practice/${unfinished.id}`} className="continue-strip">
              <span className={`topic-icon tiny ${unfinished.topic.color}`}>
                <TopicIcon name={unfinished.topic.icon} size={21} />
              </span>
              <span>
                <strong>Tiếp tục khám phá nhé?</strong>
                <small>
                  {unfinished.topic.name} · Bước {unfinished.step}/4
                </small>
              </span>
              <ChevronRight size={20} />
            </Link>
          )}
          <section className="topics-section" ref={sectionRef}>
            <div className="section-heading">
              <div>
                <h2>Hôm nay, bạn muốn khám phá gì?</h2>
                <p>Chọn một chủ đề yêu thích để bắt đầu nào.</p>
              </div>
              <span className="topic-count">
                {topics.filter((t) => t.active).length} chủ đề
              </span>
            </div>
            <div className="topic-toolbar">
              <div className="category-tabs" aria-label="Lọc chủ đề">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={category === c.id ? "selected" : ""}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <label className="search-box">
                <Search size={18} />
                <input
                  aria-label="Tìm chủ đề"
                  placeholder="Tìm chủ đề…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
            </div>
            {loading && !topics.length ? (
              <Spinner />
            ) : visible.length ? (
              <div className="topic-grid">
                {visible.map((topic, index) => (
                  <button
                    key={topic.id}
                    className={`topic-card ${topic.color}`}
                    onClick={() => {
                      setSelected(topic);
                      setDifficulty("easy");
                      setCreateError("");
                    }}
                  >
                    <div className="topic-card-top">
                      <span className={`topic-icon ${topic.color}`}>
                        <TopicIcon name={topic.icon} size={31} />
                      </span>
                      {profile.topicStats?.[topic.id] ? (
                        <span className="completed-count">
                          <Check size={14} />
                          {profile.topicStats[topic.id]} bài đã giải
                        </span>
                      ) : index === 0 ? (
                        <span className="recommended">
                          <Leaf size={13} />
                          Dễ bắt đầu
                        </span>
                      ) : null}
                    </div>
                    <h3>{topic.name}</h3>
                    <p>{copy(topic.description)}</p>
                    <div className="topic-card-bottom">
                      <span>3 mức độ khám phá</span>
                      <span className="topic-next">
                        <ChevronRight size={19} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="search-empty">
                <Search size={32} />
                <h3>Chưa tìm thấy chủ đề này</h3>
                <p>Bạn thử một từ khác hoặc xem tất cả chủ đề nhé.</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                >
                  Xem tất cả
                </button>
              </div>
            )}
          </section>
          <div className="gentle-note">
            <span>
              <Leaf size={20} />
            </span>
            <p>
              Không cần giỏi ngay từ đầu.
              <br />
              <strong>Chỉ cần tò mò và thử thêm một chút mỗi ngày.</strong>
            </p>
            <Sparkles size={25} />
          </div>
        </div>
        <aside className="progress-column">
          <section className="level-panel">
            <div className="panel-title">
              <h2>Nhà khám phá nhỏ</h2>
              <Sprout size={20} />
            </div>
            <div className="level-emblem">
              <div className="emblem-leaf">
                <Sprout size={45} strokeWidth={1.6} />
              </div>
              <span>CẤP {level.number}</span>
            </div>
            <h3>{level.name}</h3>
            <p>Mỗi nỗ lực đều giúp bạn lớn lên.</p>
            <div className="xp-label">
              <span>
                <Star size={14} /> {profile.xp} XP
              </span>
              <span>{level.next ? `${level.next} XP` : "Cấp cao nhất"}</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Tiến độ lên cấp"
              aria-valuenow={Math.round(level.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${level.progress}%`,
                }}
              />
            </div>
            <small>
              {level.next
                ? `Thêm ${level.next - profile.xp} XP để lên cấp ${level.number + 1}`
                : "Bạn đã chạm đến cột mốc cao nhất!"}
            </small>
            <div className="level-stats">
              <div>
                <BookOpen size={20} />
                <strong>{profile.solved}</strong>
                <span>Bài đã giải</span>
              </div>
              <div>
                <Flame size={20} />
                <strong>{profile.streak}</strong>
                <span>Ngày liên tiếp</span>
              </div>
            </div>
            <Link className="panel-link" to="/journey">
              Hành trình của mình <ChevronRight size={16} />
            </Link>
          </section>
          <section className="daily-panel">
            <div className="panel-title">
              <h2>Một chút mỗi ngày</h2>
              <span className="daily-icon">
                <Star size={18} />
              </span>
            </div>
            <p>Hoàn thành 3 bài toán hôm nay nhé!</p>
            <div className="daily-steps">
              {[1, 2, 3].map((n) => (
                <span key={n} className={todaySolved >= n ? "done" : ""}>
                  {todaySolved >= n ? <Check size={20} /> : <Star size={20} />}
                </span>
              ))}
            </div>
            <div className="daily-bottom">
              <strong>{Math.min(3, todaySolved)}/3 bài toán</strong>
              <span>Từng bước nhỏ, niềm vui to</span>
            </div>
          </section>
          <section className="fact-panel">
            <Lightbulb size={26} />
            <h2>Bạn có biết?</h2>
            <p>{facts[fact]}</p>
            <button onClick={() => setFact((fact + 1) % facts.length)}>
              Một điều thú vị nữa <ChevronRight size={16} />
            </button>
          </section>
        </aside>
      </div>
      {selected && (
        <div
          className="difficulty-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !creating) setSelected(null);
          }}
        >
          <section
            className="difficulty-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="difficulty-title"
          >
            <button
              className="dialog-close icon-button"
              disabled={creating}
              aria-label="Đóng chọn độ khó"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <span className={`topic-icon ${selected.color}`}>
              <TopicIcon name={selected.icon} size={32} />
            </span>
            <h2 id="difficulty-title">{selected.name}</h2>
            <p>Bạn muốn bắt đầu với thử thách nào?</p>
            <fieldset className="difficulty-options">
              <legend className="sr-only">Chọn độ khó</legend>
              {Object.entries(difficulties).map(([key, d], i) => (
                <label
                  key={key}
                  className={difficulty === key ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={key}
                    checked={difficulty === key}
                    onChange={() => setDifficulty(key)}
                    disabled={creating}
                  />
                  <span className={`difficulty-leaves leaves-${i + 1}`}>
                    {Array.from(
                      {
                        length: i + 1,
                      },
                      (_, n) => (
                        <Leaf size={19} key={n} />
                      ),
                    )}
                  </span>
                  <span>
                    <strong>{d.label}</strong>
                    <small>{d.description}</small>
                  </span>
                  <span className="difficulty-xp">+{d.xp} XP</span>
                </label>
              ))}
            </fieldset>
            <ErrorBox message={createError} />
            {demo && (
              <p className="demo-detail">
                Chơi thử dùng bài mẫu và phản hồi theo kịch bản. Mức độ chưa
                phản ánh đầy đủ bài AI.
              </p>
            )}
            <button
              className="button wide"
              onClick={create}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="small-spinner" />
                  {demo ? "Đang mở bài mẫu…" : copy("Mimo đang tạo bài toán…")}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {user || demo
                    ? copy("Cùng Mimo bắt đầu")
                    : "Đăng nhập để bắt đầu"}
                </>
              )}
            </button>
            <small className="dialog-footnote">
              {copy(
                "\n              Cứ thử nhé, Mimo sẽ luôn gợi ý khi bạn cần.\n            ",
              )}
            </small>
          </section>
        </div>
      )}
    </div>
  );
}
function CompassIcon() {
  return <Sparkles size={18} />;
}
