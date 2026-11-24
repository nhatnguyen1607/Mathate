import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  School,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { Empty, ErrorBox, Mascot, Spinner, TopicIcon } from "../components/ui";
import "../classrooms.css";
import StudentClassGuide, {
  StudentSchoolWelcome,
  StudentWaitingTopics,
} from "../components/StudentClassGuide";
import "../student-classrooms.css";
export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Không đặt hạn";
export function useSchoolLoad(path, enabled = true) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const result = await api(path);
      setData(result);
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    if (enabled)
      api(path)
        .then((value) => {
          if (alive) {
            setData(value);
            setError("");
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    else setLoading(false);
    return () => {
      alive = false;
    };
  }, [path, enabled]);
  return { data, setData, error, setError, loading, load };
}
export function SchoolGate({ teacher = false, children }) {
  const { user, ready } = useApp();
  if (!ready) return <Spinner text="Đang mở lớp học…" />;
  if (!user)
    return (
      <div className="page-wrap">
        <Empty
          title="Đăng nhập để học cùng lớp"
          action={
            <Link
              className="button"
              to="/login"
              state={{ from: teacher ? "/teacher" : "/classes" }}
            >
              Đăng nhập
            </Link>
          }
        >
          Dùng tài khoản của bạn để lưu bài làm và tham gia lớp.
        </Empty>
      </div>
    );
  if (teacher && !["teacher", "admin"].includes(user.role))
    return (
      <div className="page-wrap">
        <Empty
          title="Không gian dành cho giáo viên"
          action={
            <Link className="button" to="/classes">
              Về lớp của mình
            </Link>
          }
        >
          Quản trị viên cần cấp quyền giáo viên cho tài khoản của thầy cô.
        </Empty>
      </div>
    );
  if (!teacher && user.role === "teacher")
    return <Navigate to="/teacher" replace />;
  return children;
}
export function ClassCode({ code }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="school-code">
      <span>Mã tham gia</span>
      <strong>{code}</strong>
      <button
        className="icon-button"
        aria-label="Sao chép mã lớp"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </button>
      <span role="status">
        {failed
          ? "Chọn và sao chép mã ở trên nhé."
          : copied
            ? "Đã sao chép"
            : ""}
      </span>
    </div>
  );
}
export function ClassroomList({ teacher = false }) {
  const { user, profile } = useApp(),
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
    [code, setCode] = useState(""),
    [fullName, setFullName] = useState(
      profile.displayName || user?.displayName || "",
    ),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setFullName((old) => old || profile.displayName || user?.displayName || "");
  }, [profile.displayName, user?.displayName]);
  const root = teacher ? "/teacher" : "/classes";
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const c = await api(teacher ? "/classrooms" : "/classrooms/join", {
        method: "POST",
        body: teacher
          ? { name: name.trim() }
          : { code, fullName: fullName.trim() },
      });
      navigate(`${root}/${c.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="school-page page-wrap">
      <header className="school-page-heading">
        <div>
          <h1>{teacher ? "Lớp đang dạy" : "Lớp của mình"}</h1>
          <p>
            {teacher
              ? "Chuẩn bị khởi động, hiểu từng em và cùng lớp tiến bộ."
              : "Vào lớp, gặp thầy cô và khám phá toán cùng các bạn."}
          </p>
        </div>
        <button
          className="button"
          onClick={() => setShow(!show)}
          aria-expanded={show}
        >
          <Plus size={18} />
          {teacher ? "Tạo lớp mới" : "Tham gia lớp"}
        </button>
      </header>
      {show && (
        <form className="school-inline-form" onSubmit={submit}>
          <h2>
            {teacher ? "Một lớp học mới" : "Thầy cô đã gửi bạn mã lớp chưa?"}
          </h2>
          <div className="school-form-row">
            {teacher ? (
              <label>
                Tên lớp
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Ví dụ: Những nhà toán học 5A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : (
              <>
                <label>
                  Họ và tên đầy đủ
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Họ tên dùng trong danh sách lớp"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label>
                  Mã lớp gồm 5 chữ số
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    placeholder="12345"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                  />
                </label>
              </>
            )}
            <button className="button" disabled={busy}>
              {busy ? "Đang lưu…" : teacher ? "Tạo lớp" : "Vào lớp"}
              <ArrowRight size={17} />
            </button>
          </div>
          {!teacher && (
            <p className="school-help">
              Họ tên này giúp thầy cô nhận biết bạn và được in trên phiếu luyện
              tập nhóm.
            </p>
          )}
        </form>
      )}
      <ErrorBox message={error} retry={load} />
      {!teacher && !loading && !!classes?.length && <StudentSchoolWelcome />}
      <div className={!teacher ? "student-classroom-layout" : ""}>
        <div>
          {loading ? (
            <Spinner text="Đang tải các lớp học…" />
          ) : classes?.length ? (
            <div className="school-class-list">
              {classes.map((c) =>
                teacher ? (
                  <Link
                    className="school-class-row"
                    to={`${root}/${c.id}`}
                    key={c.id}
                  >
                    <span className="school-class-icon">
                      <School size={26} />
                    </span>
                    <div>
                      <h2>{c.name}</h2>
                      <p>
                        {teacher
                          ? `Mã lớp ${c.code}`
                          : `Giáo viên: ${c.teacherName}`}
                      </p>
                    </div>
                    <span className="school-class-open">
                      Vào lớp <ArrowRight size={19} />
                    </span>
                  </Link>
                ) : (
                  <article className="student-class-card" key={c.id}>
                    <header>
                      <span className="school-class-icon">
                        <School size={25} />
                      </span>
                      <div>
                        <h2>
                          <Link to={`/classes/${c.id}`}>{c.name}</Link>
                        </h2>
                        <p>Giáo viên: {c.teacherName}</p>
                      </div>
                    </header>
                    <div className="student-class-facts">
                      <span>
                        <BookOpen size={16} />
                        {c.topicCount || 0} chủ đề
                      </span>
                      <span>
                        <Check size={16} />
                        {c.completedCount || 0} khởi động đã xong
                      </span>
                      {c.inProgressCount > 0 && (
                        <span>
                          <Clock3 size={16} />
                          {c.inProgressCount} bài đang làm
                        </span>
                      )}
                    </div>
                    {c.topicCount > 0 ? (
                      <div className="student-class-progress">
                        <div>
                          <span>Khởi động của mình</span>
                          <strong>
                            {c.completedCount}/{c.topicCount}
                          </strong>
                        </div>
                        <progress
                          value={c.completedCount}
                          max={c.topicCount}
                          aria-label={`Đã hoàn thành ${c.completedCount} trên ${c.topicCount} khởi động`}
                        />
                      </div>
                    ) : (
                      <p className="student-class-waiting">
                        Lớp chưa có chủ đề được giao. Mình cùng chờ thầy cô nhé!
                      </p>
                    )}
                    <footer>
                      <span>
                        {c.nextDeadline ? (
                          <>
                            <Clock3 size={15} />
                            Hạn gần nhất: {dateTime(c.nextDeadline)}
                          </>
                        ) : c.openApplicationCount ? (
                          `${c.openApplicationCount} chủ đề đã mở vận dụng`
                        ) : (
                          "Học theo nhịp của lớp, từng bước một."
                        )}
                      </span>
                      <Link to={`/classes/${c.id}`} className="text-button">
                        Vào lớp
                        <ArrowRight size={17} />
                      </Link>
                    </footer>
                    {c.nextWarmup?.started && (
                      <Link
                        className="student-resume-warmup"
                        to={`/classes/${c.id}/warmup/${c.nextWarmup.id}`}
                      >
                        <Clock3 size={17} />
                        <span>
                          Tiếp tục khởi động · {c.nextWarmup.topicName}
                        </span>
                        <ArrowRight size={17} />
                      </Link>
                    )}
                  </article>
                ),
              )}
            </div>
          ) : (
            !error && (
              <div className="school-welcome">
                <Mascot pose="reading" />
                <div>
                  <h2>
                    {teacher
                      ? "Lớp học bắt đầu từ một cái tên."
                      : "Có cả một lớp đang chờ bạn!"}
                  </h2>
                  <p>
                    {teacher
                      ? "Tạo lớp, gửi mã 5 chữ số cho học sinh, rồi chuẩn bị phần khởi động đầu tiên."
                      : "Nhấn “Tham gia lớp” và nhập mã 5 chữ số thầy cô gửi để bắt đầu nhé."}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setShow(true)}
                  >
                    {teacher ? <Plus size={18} /> : <KeyRound size={18} />}
                    {teacher ? "Tạo lớp đầu tiên" : "Nhập mã lớp"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
        {!teacher && !loading && classes && <StudentClassGuide />}
      </div>
      <p className="school-bottom-note">
        <BookOpen size={17} />
        {teacher
          ? "Kết quả khởi động giúp thầy cô chuẩn bị bài phù hợp. Thứ hạng và phiếu nhóm chỉ hiển thị cho giáo viên."
          : "Phần khởi động chỉ làm một lần. Phần vận dụng sẽ mở khi thầy cô sẵn sàng."}
      </p>
    </div>
  );
}
export default function StudentClasses() {
  return (
    <SchoolGate>
      <ClassroomList />
    </SchoolGate>
  );
}
export function StudentClass() {
  const { classId } = useParams(),
    { user } = useApp(),
    navigate = useNavigate();
  const { data, loading, error, setError, load } = useSchoolLoad(
    `/classrooms/${classId}`,
    !!user,
  );
  const [busy, setBusy] = useState(null);
  async function application(a) {
    if (busy) return;
    setBusy(a.id);
    setError("");
    try {
      const s = await api("/sessions", {
        method: "POST",
        body: {
          topicId: a.topic.id,
          difficulty: "easy",
          classId,
          activityId: a.id,
        },
      });
      navigate(`/practice/${s.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <SchoolGate>
      <div className="school-page page-wrap">
        <Link className="back-link" to="/classes">
          <ChevronLeft size={18} />
          Các lớp của mình
        </Link>
        <ErrorBox message={error} retry={load} />
        {loading ? (
          <Spinner text="Đang mở lớp…" />
        ) : (
          data && (
            <>
              <header className="school-page-heading">
                <div>
                  <h1>{data.classroom.name}</h1>
                  <p>
                    Giáo viên: {data.classroom.teacherName} · Chào{" "}
                    {data.member?.fullName || "bạn"}!
                  </p>
                </div>
                <button className="button secondary" onClick={load}>
                  <RefreshCw size={17} />
                  Làm mới
                </button>
              </header>
              <StudentSchoolWelcome
                inClass
                total={data.activities.length}
                completed={
                  data.activities.filter(
                    (a) => a.attempt?.status === "submitted",
                  ).length
                }
              />
              <div className="student-classroom-layout">
                <section className="student-class-subjects">
                  <div className="student-subjects-heading">
                    <h2>Chủ đề của lớp</h2>
                    <span>{data.activities.length} chủ đề</span>
                  </div>
                  {data.activities.length ? (
                    <div className="school-activity-list">
                      {data.activities.map((a) => {
                        const submitted = a.attempt?.status === "submitted",
                          started = a.attempt?.status === "in_progress",
                          closed =
                            a.deadline &&
                            Date.parse(a.deadline) <= data.serverNow &&
                            !started;
                        return (
                          <section className="school-student-topic" key={a.id}>
                            <div className="school-topic-title">
                              <span className={`topic-icon ${a.topic.color}`}>
                                <TopicIcon name={a.topic.icon} size={25} />
                              </span>
                              <div>
                                <h2>{a.topic.name}</h2>
                                <p>
                                  <Clock3 size={15} />
                                  Khởi động: {dateTime(a.deadline)}
                                </p>
                              </div>
                            </div>
                            <div className="school-two-parts">
                              <div>
                                <span className="school-part-icon">
                                  <BookOpen size={22} />
                                </span>
                                <h3>Khởi động</h3>
                                <p>
                                  {submitted
                                    ? `Bạn đã hoàn thành · ${a.attempt.result.score}/10 điểm`
                                    : "8 câu trắc nghiệm · 7 phút · một lượt duy nhất"}
                                </p>
                                <Link
                                  className={`button ${submitted ? "secondary" : ""}`}
                                  to={`/classes/${classId}/warmup/${a.id}`}
                                >
                                  {submitted
                                    ? "Xem kết quả của mình"
                                    : started
                                      ? "Tiếp tục khởi động"
                                      : closed
                                        ? "Xem thông tin"
                                        : "Vào khởi động"}
                                  <ArrowRight size={16} />
                                </Link>
                              </div>
                              <div
                                className={
                                  !a.applicationEnabled
                                    ? "school-part-locked"
                                    : ""
                                }
                              >
                                <span className="school-part-icon">
                                  {a.applicationEnabled ? (
                                    <Users size={22} />
                                  ) : (
                                    <LockKeyhole size={22} />
                                  )}
                                </span>
                                <h3>Vận dụng</h3>
                                <p>
                                  {a.applicationEnabled
                                    ? "Cùng bạn đồng hành giải toán, từng bước một."
                                    : "Thầy cô sẽ mở phần này khi lớp sẵn sàng."}
                                </p>
                                <button
                                  className="button secondary"
                                  disabled={!a.applicationEnabled || !!busy}
                                  onClick={() => application(a)}
                                >
                                  {busy === a.id
                                    ? "Đang chuẩn bị bài…"
                                    : a.applicationEnabled
                                      ? "Cùng giải toán"
                                      : "Chờ thầy cô mở"}
                                  {a.applicationEnabled && (
                                    <ArrowRight size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <StudentWaitingTopics onRefresh={load} />
                  )}
                </section>
                <StudentClassGuide inClass />
              </div>
            </>
          )
        )}
      </div>
    </SchoolGate>
  );
}
