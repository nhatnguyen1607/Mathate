import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  School,
  Search,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { ErrorBox, Mascot, Spinner } from "../components/ui";
import { dateTime, useSchoolLoad } from "./Classrooms";
export function TeacherSummary({ items }) {
  return (
    <dl className="teacher-summary">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label}>
          <dt>
            <Icon size={18} />
            {label}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export default function TeacherOverview() {
  const { user } = useApp(),
    navigate = useNavigate();
  const {
    data: classes,
    loading,
    error,
    setError,
    load,
  } = useSchoolLoad("/classrooms", !!user);
  const [show, setShow] = useState(false),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  const summary = useMemo(
    () =>
      (classes || []).reduce(
        (sum, c) => ({
          students: sum.students + c.studentCount,
          topics: sum.topics + c.topicCount,
          drafts: sum.drafts + c.draftCount,
          submitted: sum.submitted + c.submittedCount,
        }),
        { students: 0, topics: 0, drafts: 0, submitted: 0 },
      ),
    [classes],
  );
  const allActivities = (classes || []).flatMap((c) =>
    (c.activities || []).map((a) => ({
      ...a,
      classId: c.id,
      className: c.name,
    })),
  );
  const upcoming = allActivities
    .filter(
      (a) => a.published && a.deadline && Date.parse(a.deadline) > Date.now(),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);
  const drafts = allActivities.filter((a) => !a.published).slice(0, 3);
  const needGroups = allActivities
    .filter((a) => a.published && a.submittedCount > 0 && !a.planId)
    .slice(0, 3);
  const tasks = [
    ...drafts.map((a) => ({
      ...a,
      action: "Xem lại và giao khởi động",
      icon: FileText,
    })),
    ...needGroups.map((a) => ({
      ...a,
      action: `${a.submittedCount} bài đã nộp · có thể tạo phiếu`,
      icon: Users,
    })),
  ].slice(0, 4);
  const visible = (classes || []).filter(
    (c) =>
      c.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")) ||
      c.code.includes(search),
  );
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/classrooms", {
        method: "POST",
        body: { name: name.trim() },
      });
      navigate(`/teacher/${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="school-page teacher-overview page-wrap">
      <header className="school-page-heading">
        <div>
          <h1>Lớp đang dạy</h1>
          <p>Một góc nhỏ để thầy cô chuẩn bị những buổi học thật vui.</p>
        </div>
        <button
          className="button"
          aria-expanded={show}
          onClick={() => setShow(!show)}
        >
          <Plus size={18} />
          Tạo lớp mới
        </button>
      </header>
      {show && (
        <form className="school-inline-form" onSubmit={create}>
          <h2>Một lớp học mới</h2>
          <div className="school-form-row">
            <label>
              Tên lớp
              <input
                autoFocus
                required
                minLength={2}
                maxLength={80}
                placeholder="Ví dụ: Lớp 5A · Những nhà khám phá"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Đang tạo…" : "Tạo lớp và nhận mã"}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      )}
      <ErrorBox message={error} retry={load} />
      {loading ? (
        <Spinner text="Đang tổng hợp các lớp của thầy cô…" />
      ) : (
        classes && (
          <>
            <section className="teacher-welcome">
              <div>
                <h2>
                  Mỗi lớp học,
                  <br />
                  một vườn khám phá.
                </h2>
                <p>
                  Từ một bài khởi động nhỏ, thầy cô hiểu các em hơn và chuẩn bị
                  những bài luyện tập vừa sức.
                </p>
                <div className="teacher-welcome-flow">
                  <span>
                    <BookOpen size={16} />
                    Giao nhiệm vụ
                  </span>
                  <ChevronRight size={14} />
                  <span>
                    <Users size={16} />
                    Hiểu từng nhóm
                  </span>
                  <ChevronRight size={14} />
                  <span>
                    <FileText size={16} />
                    Luyện tập thêm tại lớp
                  </span>
                </div>
              </div>
              <Mascot pose="reading" />
            </section>
            <TeacherSummary
              items={[
                {
                  label: "Lớp đang phụ trách",
                  value: classes.length,
                  icon: School,
                },
                {
                  label: "Lượt học sinh tham gia",
                  value: summary.students,
                  icon: Users,
                },
                {
                  label: "Chủ đề đã chuẩn bị",
                  value: summary.topics,
                  icon: BookOpen,
                },
                {
                  label: "Bản nháp chờ giao",
                  value: summary.drafts,
                  icon: FileText,
                },
              ]}
            />
            <div className="teacher-overview-layout">
              <div className="teacher-overview-main">
                <div className="teacher-list-heading">
                  <h2>
                    Các lớp của thầy cô <span>({classes.length})</span>
                  </h2>
                  <button className="text-button" onClick={load}>
                    <RefreshCw size={16} />
                    Làm mới
                  </button>
                </div>
                {classes.length > 3 && (
                  <label className="teacher-class-search">
                    <Search size={17} />
                    <span className="sr-only">Tìm theo tên hoặc mã lớp</span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm tên hoặc mã lớp…"
                    />
                  </label>
                )}
                {visible.length ? (
                  <div className="teacher-class-list">
                    {visible.map((c) => (
                      <article className="teacher-class-card" key={c.id}>
                        <header>
                          <span className="school-class-icon">
                            <School size={25} />
                          </span>
                          <div>
                            <h3>
                              <Link to={`/teacher/${c.id}`}>{c.name}</Link>
                            </h3>
                            <p>
                              Mã tham gia <strong>{c.code}</strong>
                            </p>
                          </div>
                          <Link
                            to={`/teacher/${c.id}`}
                            className="teacher-open-class"
                            aria-label={`Vào lớp ${c.name}`}
                          >
                            <ArrowRight size={21} />
                          </Link>
                        </header>
                        <dl>
                          <div>
                            <dt>Học sinh</dt>
                            <dd>{c.studentCount}</dd>
                          </div>
                          <div>
                            <dt>Chủ đề</dt>
                            <dd>{c.topicCount}</dd>
                          </div>
                          <div>
                            <dt>Bài đã nộp</dt>
                            <dd>{c.submittedCount}</dd>
                          </div>
                        </dl>
                        <footer>
                          <p>
                            {!c.studentCount
                              ? "Gửi mã lớp để đón những học sinh đầu tiên."
                              : !c.topicCount
                                ? "Lớp đã có học sinh. Cùng chuẩn bị chủ đề đầu tiên!"
                                : c.draftCount
                                  ? `Có ${c.draftCount} khởi động đang chờ thầy cô duyệt.`
                                  : `${c.publishedCount} chủ đề đã giao · theo dõi kết quả trong lớp.`}
                          </p>
                          <Link to={`/teacher/${c.id}`}>
                            Vào lớp <ArrowRight size={16} />
                          </Link>
                        </footer>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="teacher-no-classes">
                    <School size={30} />
                    <h3>
                      {classes.length
                        ? "Chưa tìm thấy lớp phù hợp"
                        : "Bắt đầu với lớp học đầu tiên"}
                    </h3>
                    <p>
                      {classes.length
                        ? "Thầy cô thử tên hoặc mã khác nhé."
                        : "Đặt tên lớp để nhận mã 5 chữ số. Học sinh dùng mã này để tham gia bằng tài khoản của mình."}
                    </p>
                    {!classes.length && (
                      <button
                        className="button secondary"
                        onClick={() => setShow(true)}
                      >
                        <Plus size={17} />
                        Tạo lớp đầu tiên
                      </button>
                    )}
                  </div>
                )}
                <section className="teacher-next-steps">
                  <div className="teacher-list-heading">
                    <h2>Việc cần chuẩn bị</h2>
                    <span>
                      {tasks.length
                        ? `${tasks.length} mục cần xem`
                        : "Theo nhịp của lớp"}
                    </span>
                  </div>
                  {tasks.length ? (
                    <ul>
                      {tasks.map((task) => (
                        <li key={`${task.classId}-${task.id}`}>
                          <task.icon size={21} />
                          <div>
                            <h3>{task.topic.name}</h3>
                            <p>
                              {task.className} · {task.action}
                            </p>
                          </div>
                          <Link
                            className="text-button"
                            to={`/teacher/${task.classId}/topics/${task.id}`}
                          >
                            Mở <ArrowRight size={16} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="teacher-task-empty">
                      <Check size={23} />
                      <div>
                        <strong>
                          {classes.length
                            ? "Chưa có bản nháp hoặc bài nộp cần xử lý."
                            : "Thầy cô chưa có lớp để giao bài."}
                        </strong>
                        <p>
                          {classes.length
                            ? "Sau khi thêm chủ đề, bản nháp và các kết quả đủ để chia nhóm sẽ xuất hiện ở đây."
                            : "Tạo lớp, mời các em tham gia và chuẩn bị khởi động đầu tiên nhé."}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
              <aside className="teacher-overview-aside">
                <section className="teacher-agenda">
                  <h2>
                    <CalendarDays size={21} />
                    Hạn khởi động sắp tới
                  </h2>
                  {upcoming.length ? (
                    <ul>
                      {upcoming.map((a) => (
                        <li key={`${a.classId}-${a.id}`}>
                          <span>
                            <Clock3 size={16} />
                            {dateTime(a.deadline)}
                          </span>
                          <Link to={`/teacher/${a.classId}/topics/${a.id}`}>
                            <strong>{a.topic.name}</strong>
                            <ArrowRight size={16} />
                          </Link>
                          <p>
                            {a.className} · {a.submittedCount} em đã nộp
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div className="teacher-agenda-empty">
                        <CalendarDays size={30} />
                        <h3>Chưa có hạn sắp tới</h3>
                        <p>
                          Thầy cô có thể đặt hạn khi tạo khởi động hoặc chỉnh
                          lại trong từng chủ đề.
                        </p>
                      </div>
                      {classes[0] && (
                        <Link
                          className="text-button"
                          to={`/teacher/${classes[0].id}`}
                        >
                          Chuẩn bị trong lớp <ArrowRight size={16} />
                        </Link>
                      )}
                    </>
                  )}
                </section>
              </aside>
            </div>
            <p className="school-bottom-note">
              <BookOpen size={17} />
              Kết quả và thứ tự xếp nhóm chỉ dành cho giáo viên. Các em nhìn
              thấy kết quả của riêng mình.
            </p>
          </>
        )
      )}
    </div>
  );
}
