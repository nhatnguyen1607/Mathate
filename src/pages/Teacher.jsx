import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Clock3,
  Plus,
  RefreshCw,
  Users,
  FileText,
  UnlockKeyhole,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { ErrorBox, Mascot, Spinner, TopicIcon } from "../components/ui";
import { ClassCode, SchoolGate, dateTime, useSchoolLoad } from "./Classrooms";
import TeacherOverview, { TeacherSummary } from "./TeacherOverview";
import TeacherClassGuide from "../components/TeacherClassGuide";
export default function Teacher() {
  return (
    <SchoolGate teacher>
      <TeacherOverview />
    </SchoolGate>
  );
}
export function TeacherClass() {
  const { classId } = useParams(),
    { user, topics } = useApp(),
    navigate = useNavigate();
  const { data, loading, error, setError, load } = useSchoolLoad(
    `/classrooms/${classId}`,
    !!user && ["teacher", "admin"].includes(user.role),
  );
  const [show, setShow] = useState(false),
    [topicId, setTopicId] = useState(""),
    [deadline, setDeadline] = useState(""),
    [busy, setBusy] = useState(false);
  const available = topics.filter(
    (t) => t.active && !data?.activities.some((a) => a.topic.id === t.id),
  );
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const a = await api(`/classrooms/${classId}/activities`, {
        method: "POST",
        body: {
          topicId,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        },
      });
      navigate(`/teacher/${classId}/topics/${a.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SchoolGate teacher>
      <div className="school-page page-wrap">
        <Link className="back-link" to="/teacher">
          <ChevronLeft size={18} />
          Lớp đang dạy
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
                  <p>Cùng các em khám phá toán, từng bước một.</p>
                </div>
                <ClassCode code={data.classroom.code} />
              </header>
              <TeacherSummary
                items={[
                  {
                    label: "Học sinh của lớp",
                    value: data.members.length,
                    icon: Users,
                  },
                  {
                    label: "Chủ đề đã giao",
                    value: data.activities.filter((a) => a.published).length,
                    icon: BookOpen,
                  },
                  {
                    label: "Khởi động đã nộp",
                    value: data.activities.reduce(
                      (n, a) => n + a.submittedCount,
                      0,
                    ),
                    icon: FileText,
                  },
                  {
                    label: "Vận dụng đang mở",
                    value: data.activities.filter((a) => a.applicationEnabled)
                      .length,
                    icon: UnlockKeyhole,
                  },
                ]}
              />
              <div className="teacher-class-layout">
                <div className="teacher-class-work">
                  <div className="school-section-heading">
                    <h2>Chủ đề của lớp</h2>
                    <div>
                      <button
                        className="icon-button"
                        aria-label="Làm mới lớp"
                        onClick={load}
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        className="button"
                        onClick={() => setShow(!show)}
                        disabled={busy}
                        aria-expanded={show}
                      >
                        <Plus size={17} />
                        Thêm chủ đề
                      </button>
                    </div>
                  </div>
                  {show && (
                    <form className="school-inline-form" onSubmit={create}>
                      <h3>Chuẩn bị khởi động</h3>
                      <p>
                        Bài gồm 8 câu, thời gian làm 7 phút. Thầy cô xem lại đáp
                        án trước khi giao cho lớp.
                      </p>
                      <div className="school-form-row">
                        <label>
                          Chủ đề
                          <select
                            autoFocus
                            required
                            value={topicId}
                            onChange={(e) => setTopicId(e.target.value)}
                          >
                            <option value="">Chọn chủ đề…</option>
                            {available.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Hạn khởi động (không bắt buộc)
                          <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                          />
                        </label>
                        <button className="button" disabled={busy || !topicId}>
                          {busy ? "AI đang soạn 8 câu…" : "Tạo đề khởi động"}
                          <ArrowRight size={17} />
                        </button>
                      </div>
                      {!available.length && (
                        <p className="school-help">
                          Các chủ đề hiện có đều đã được thêm vào lớp.
                        </p>
                      )}
                    </form>
                  )}
                  {data.activities.length ? (
                    <div className="school-assignment-list">
                      {data.activities.map((a) => (
                        <Link
                          className="school-assignment-row"
                          to={`/teacher/${classId}/topics/${a.id}`}
                          key={a.id}
                        >
                          <span className={`topic-icon ${a.topic.color}`}>
                            <TopicIcon name={a.topic.icon} size={24} />
                          </span>
                          <div>
                            <h3>{a.topic.name}</h3>
                            <p>
                              <Clock3 size={14} />
                              {dateTime(a.deadline)}
                            </p>
                            {a.published && data.members.length > 0 && (
                              <progress
                                className="teacher-topic-progress"
                                value={a.submittedCount}
                                max={data.members.length}
                                aria-label={`${a.submittedCount} trên ${data.members.length} học sinh đã nộp`}
                              />
                            )}
                          </div>
                          <div className="school-assignment-meta">
                            <span className="school-state">
                              {a.published
                                ? `${a.submittedCount}/${data.members.length} đã nộp`
                                : "Bản nháp"}
                            </span>
                            <small>
                              Vận dụng:{" "}
                              {a.applicationEnabled ? "đang mở" : "đang khóa"}
                            </small>
                          </div>
                          <ArrowRight size={19} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    !show && (
                      <section className="teacher-first-topic">
                        <div>
                          <h3>Buổi học đầu tiên bắt đầu từ một chủ đề.</h3>
                          <p>
                            Chọn nội dung bên dưới để chuẩn bị 8 câu khởi động.
                            Thầy cô có thể xem và chỉnh đề trước khi giao.
                          </p>
                          <button
                            className="button"
                            onClick={() => setShow(true)}
                          >
                            <Plus size={17} />
                            Chuẩn bị khởi động
                          </button>
                        </div>
                        <Mascot pose="reading" />
                        <div className="teacher-topic-suggestions">
                          <span>Một vài chủ đề để bắt đầu</span>
                          <div>
                            {available.slice(0, 3).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setTopicId(t.id);
                                  setShow(true);
                                }}
                              >
                                <TopicIcon name={t.icon} size={18} />
                                {t.name}
                                <ArrowRight size={15} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>
                    )
                  )}
                  <section className="school-roster">
                    <div className="school-section-heading">
                      <h2>
                        <Users size={21} />
                        Danh sách lớp <span>({data.members.length})</span>
                      </h2>
                    </div>
                    {data.members.length ? (
                      <ol>
                        {data.members.map((m) => (
                          <li key={m.uid}>
                            <span>{m.fullName}</span>
                            <small>Tham gia {dateTime(m.joinedAt)}</small>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="teacher-roster-empty">
                        <Users size={27} />
                        <div>
                          <h3>Đang chờ những gương mặt đầu tiên.</h3>
                          <p>
                            Chia sẻ mã <strong>{data.classroom.code}</strong>.
                            Khi các em tham gia, họ tên và ngày vào lớp sẽ xuất
                            hiện tại đây.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
                <TeacherClassGuide data={data} />
              </div>
            </>
          )
        )}
      </div>
    </SchoolGate>
  );
}
