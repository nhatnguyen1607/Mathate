import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  Clock3,
  Download,
  Eye,
  FileText,
  LockKeyhole,
  RefreshCw,
  Send,
  UnlockKeyhole,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { ErrorBox, Spinner } from "../components/ui";
import { SchoolGate, dateTime, useSchoolLoad } from "./Classrooms";
import { difficulties } from "../../shared/catalog";
import { skillNames } from "../../shared/classrooms";
export default function TeacherActivity() {
  const { classId, activityId } = useParams(),
    { user } = useApp();
  const path = `/classrooms/${classId}/activities/${activityId}`;
  const { data, setData, loading, error, setError, load } = useSchoolLoad(
    path,
    !!user && ["teacher", "admin"].includes(user.role),
  );
  const [tab, setTab] = useState("results"),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [deadline, setDeadline] = useState(""),
    [editingDeadline, setEditingDeadline] = useState(false),
    [editingQuiz, setEditingQuiz] = useState(null);
  const running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!data?.published) return;
    const timer = setInterval(() => {
      if (!document.hidden && !running.current) load();
    }, 15000);
    return () => clearInterval(timer);
  }, [data?.published, load]);
  async function patch(changes, message) {
    if (running.current) return;
    running.current = true;
    setBusy("save");
    setError("");
    setNotice("");
    try {
      setData(await api(path, { method: "PATCH", body: changes }));
      setNotice(message);
      setEditingDeadline(false);
      setEditingQuiz(null);
    } catch (e) {
      setError(e.message);
    } finally {
      running.current = false;
      setBusy("");
    }
  }
  async function generate(rebuild = false) {
    if (running.current) return;
    if (
      rebuild &&
      !window.confirm(
        "Chia lại nhóm theo toàn bộ kết quả đã nộp hiện tại? Phiếu cũ được giữ trong hệ thống, giao diện sẽ chuyển sang bộ phiếu mới.",
      )
    )
      return;
    if (!data.plan || rebuild) {
      const count = data.results.filter((r) => r.status === "submitted").length;
      if (
        !window.confirm(
          `Chốt nhóm từ ${count}/${data.results.length} học sinh đã nộp? Mỗi nhóm tối đa 5 em và có 2 bài. Thầy cô có thể chia lại khi có thêm kết quả.`,
        )
      )
        return;
    }
    running.current = true;
    setBusy("groups");
    setError("");
    setNotice("");
    setTab("groups");
    let failures = 0;
    try {
      let current = await api(`${path}/groups`, {
        method: "POST",
        body: { rebuild },
      });
      if (mounted.current) setData(current);
      for (const group of current.groups) {
        if (!mounted.current) break;
        if (group.status === "ready") continue;
        if (mounted.current)
          setNotice(
            `Đang tạo 2 bài cho nhóm ${group.number}/${current.groups.length}… Thầy cô có thể tiếp tục nếu rời trang.`,
          );
        try {
          const result = await api(`${path}/groups/${group.id}/generate`, {
            method: "POST",
            body: { planId: current.plan.id },
          });
          current = {
            ...current,
            groups: current.groups.map((g) =>
              g.id === result.id ? result : g,
            ),
          };
          if (mounted.current) setData(current);
        } catch (e) {
          failures++;
          if (mounted.current) setError(e.message);
        }
      }
      if (mounted.current) {
        await load();
        setNotice(
          failures
            ? "Một số nhóm chưa tạo xong. Thầy cô nhấn “Tiếp tục tạo phiếu” để thử lại; phiếu hoàn tất được giữ."
            : "Đã tạo đủ 2 bài cho mỗi nhóm. Thầy cô có thể xuất PDF.",
        );
      }
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      running.current = false;
      if (mounted.current) setBusy("");
    }
  }
  async function download(groupId) {
    if (busy) return;
    setBusy("pdf");
    setError("");
    try {
      const blob = await api(
        `${path}/pdf${groupId ? `?groupId=${groupId}` : ""}`,
        { blob: true },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mathate-${groupId || "cac-nhom"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const submitted =
    data?.results.filter((r) => r.status === "submitted").length || 0;
  const allReady =
    data?.groups.length > 0 && data.groups.every((g) => g.status === "ready");
  const ranked = data?.results
    ? [...data.results].sort(
        (a, b) =>
          (b.score ?? -1) - (a.score ?? -1) ||
          a.joinedAt.localeCompare(b.joinedAt) ||
          a.uid.localeCompare(b.uid),
      )
    : [];
  return (
    <SchoolGate teacher>
      <div className="school-page page-wrap">
        <Link className="back-link" to={`/teacher/${classId}`}>
          <ChevronLeft size={18} />
          Về lớp học
        </Link>
        <ErrorBox message={error} />
        {loading ? (
          <Spinner text="Đang tải chủ đề của lớp…" />
        ) : (
          data &&
          data.results && (
            <>
              <header className="school-page-heading">
                <div>
                  <h1>{data.topic.name}</h1>
                  <p>
                    {data.classroom?.name} ·{" "}
                    {data.published
                      ? "Đã giao cho lớp"
                      : "Bản nháp · Học sinh chưa nhìn thấy"}{" "}
                    · 8 câu · 7 phút
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={load}
                >
                  <RefreshCw size={17} />
                  Làm mới
                </button>
              </header>
              <div className="school-teacher-controls">
                <div className="school-deadline">
                  <Clock3 size={20} />
                  <div>
                    <strong>Hạn khởi động</strong>
                    <span>{dateTime(data.deadline)}</span>
                  </div>
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => {
                      const value = data.deadline
                        ? new Date(
                            Date.parse(data.deadline) -
                              new Date(data.deadline).getTimezoneOffset() *
                                60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : "";
                      setDeadline(value);
                      setEditingDeadline(!editingDeadline);
                    }}
                  >
                    Sửa hạn
                  </button>
                </div>
                <div className="school-application-control">
                  {data.applicationEnabled ? (
                    <UnlockKeyhole size={21} />
                  ) : (
                    <LockKeyhole size={21} />
                  )}
                  <div>
                    <strong>Vận dụng</strong>
                    <span>
                      {data.applicationEnabled
                        ? "Học sinh được vào giải toán"
                        : "Đang khóa với học sinh"}
                    </span>
                  </div>
                  <button
                    className="button secondary"
                    disabled={!!busy || !data.published}
                    onClick={() =>
                      patch(
                        { applicationEnabled: !data.applicationEnabled },
                        data.applicationEnabled
                          ? "Đã khóa phần vận dụng."
                          : "Đã mở phần vận dụng cho cả lớp.",
                      )
                    }
                  >
                    {data.applicationEnabled ? "Khóa vận dụng" : "Mở vận dụng"}
                  </button>
                </div>
              </div>
              {editingDeadline && (
                <form
                  className="school-inline-form school-form-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    patch(
                      {
                        deadline: deadline
                          ? new Date(deadline).toISOString()
                          : null,
                      },
                      "Đã cập nhật hạn khởi động.",
                    );
                  }}
                >
                  <label>
                    Hạn mới
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </label>
                  <button className="button" disabled={!!busy}>
                    Lưu hạn
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setEditingDeadline(false)}
                  >
                    Hủy
                  </button>
                  <p className="school-help">
                    Để trống nếu không đặt hạn. Mỗi lượt đã bắt đầu vẫn có tối
                    đa 7 phút.
                  </p>
                </form>
              )}
              {notice && (
                <p className="school-notice" role="status">
                  {notice}
                </p>
              )}
              <nav className="school-tabs" aria-label="Quản lý chủ đề">
                <button
                  className={tab === "results" ? "active" : ""}
                  aria-current={tab === "results" ? "page" : undefined}
                  onClick={() => setTab("results")}
                >
                  <Users size={18} />
                  Kết quả khởi động{" "}
                  <span>
                    {submitted}/{data.results.length}
                  </span>
                </button>
                <button
                  className={tab === "quiz" ? "active" : ""}
                  aria-current={tab === "quiz" ? "page" : undefined}
                  onClick={() => setTab("quiz")}
                >
                  <Eye size={18} />
                  Đề và đáp án
                </button>
                <button
                  className={tab === "groups" ? "active" : ""}
                  aria-current={tab === "groups" ? "page" : undefined}
                  onClick={() => setTab("groups")}
                >
                  <FileText size={18} />
                  Phiếu theo nhóm
                </button>
              </nav>
              {!data.published && (
                <div className="school-draft-notice">
                  <div>
                    <h2>Đề đã sẵn sàng để xem lại.</h2>
                    <p>
                      Thầy cô kiểm tra câu hỏi, đáp án và hạn nộp trước khi
                      giao. Đề đã giao sẽ được giữ nguyên để chấm công bằng.
                    </p>
                  </div>
                  <button
                    className="button"
                    disabled={!!busy || !!editingQuiz}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Giao 8 câu khởi động cho lớp? Sau khi giao, nội dung và đáp án sẽ được khóa.",
                        )
                      )
                        patch(
                          { published: true },
                          "Đã giao khởi động. Học sinh có thể bắt đầu làm bài.",
                        );
                    }}
                  >
                    <Send size={17} />
                    Giao nhiệm vụ
                  </button>
                </div>
              )}
              {tab === "results" && (
                <section>
                  <div className="school-section-heading">
                    <div>
                      <h2>{submitted} em đã hoàn thành</h2>
                      <p>
                        Mỗi câu đúng có cùng điểm. Bỏ trống hoặc sai được 0
                        điểm, không trừ điểm.
                      </p>
                    </div>
                    <button
                      className="button"
                      disabled={!!busy || !submitted || !data.published}
                      onClick={() => generate(false)}
                    >
                      <FileText size={18} />
                      {data.plan
                        ? allReady
                          ? "Xem / tiếp tục phiếu"
                          : "Tiếp tục tạo phiếu"
                        : "Tạo đề luyện tập"}
                    </button>
                  </div>
                  <div className="school-table-wrap">
                    <table className="school-table">
                      <caption className="sr-only">
                        Kết quả khởi động xếp từ cao xuống thấp, chỉ giáo viên
                        xem được
                      </caption>
                      <thead>
                        <tr>
                          <th>Thứ tự</th>
                          <th>Họ và tên</th>
                          <th>Trạng thái</th>
                          <th>Số câu đúng</th>
                          <th>Điểm / 10</th>
                          <th>Nộp lúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranked.map((r, i) => (
                          <tr key={r.uid}>
                            <td>{r.status === "submitted" ? i + 1 : "—"}</td>
                            <th scope="row">{r.fullName}</th>
                            <td>
                              <span className="school-state">
                                {r.status === "submitted"
                                  ? "Đã nộp"
                                  : r.status === "in_progress"
                                    ? "Đang làm"
                                    : "Chưa bắt đầu"}
                              </span>
                            </td>
                            <td>
                              {r.result
                                ? `${r.result.correct}/${r.result.total}`
                                : "—"}
                            </td>
                            <td className="school-score">{r.score ?? "—"}</td>
                            <td>
                              {r.submittedAt ? dateTime(r.submittedAt) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!ranked.length && (
                      <p className="school-table-empty">
                        Chưa có học sinh. Gửi mã lớp để các em tham gia.
                      </p>
                    )}
                  </div>
                  <p className="school-help">
                    Cùng điểm: giữ thứ tự tham gia lớp, không dùng tốc độ làm
                    bài. Kết quả và thứ tự này không hiển thị cho học sinh.
                  </p>
                </section>
              )}
              {tab === "quiz" && (
                <section className="school-quiz-review">
                  <div className="school-section-heading">
                    <div>
                      <h2>8 câu khởi động</h2>
                      <p>
                        Thang 10 · đúng 1 câu được 1,25 điểm · chỉ 1 đáp án đúng
                        mỗi câu
                      </p>
                    </div>
                    {!data.published && (
                      <button
                        className="button secondary"
                        disabled={!!busy || !!editingQuiz}
                        onClick={() =>
                          setEditingQuiz(structuredClone(data.questions))
                        }
                      >
                        Chỉnh sửa đề
                      </button>
                    )}
                  </div>
                  {(editingQuiz || data.questions).map((q, i) => (
                    <article key={q.id} className="school-review-question">
                      <div className="school-question-meta">
                        <strong>Câu {i + 1}</strong>
                        <span>{skillNames[q.skill]}</span>
                      </div>
                      {editingQuiz ? (
                        <>
                          <label>
                            Nội dung
                            <textarea
                              value={q.text}
                              maxLength={700}
                              onChange={(e) =>
                                setEditingQuiz((old) =>
                                  old.map((x, n) =>
                                    n === i
                                      ? { ...x, text: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                          {q.options.map((o, j) => (
                            <label key={j}>
                              Phương án {String.fromCharCode(65 + j)}
                              <input
                                value={o}
                                maxLength={200}
                                onChange={(e) =>
                                  setEditingQuiz((old) =>
                                    old.map((x, n) =>
                                      n === i
                                        ? {
                                            ...x,
                                            options: x.options.map(
                                              (value, k) =>
                                                k === j
                                                  ? e.target.value
                                                  : value,
                                            ),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ))}
                          <label>
                            Đáp án đúng
                            <select
                              value={q.correctIndex}
                              onChange={(e) =>
                                setEditingQuiz((old) =>
                                  old.map((x, n) =>
                                    n === i
                                      ? {
                                          ...x,
                                          correctIndex: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              {q.options.map((o, j) => (
                                <option key={j} value={j}>
                                  {String.fromCharCode(65 + j)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Giải thích
                            <textarea
                              value={q.explanation}
                              maxLength={1200}
                              onChange={(e) =>
                                setEditingQuiz((old) =>
                                  old.map((x, n) =>
                                    n === i
                                      ? { ...x, explanation: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <h3>{q.text}</h3>
                          <ol className="school-review-options">
                            {q.options.map((o, j) => (
                              <li
                                key={j}
                                className={
                                  q.correctIndex === j ? "is-correct" : ""
                                }
                              >
                                <b>{String.fromCharCode(65 + j)}</b>
                                <span>{o}</span>
                                {q.correctIndex === j && <Check size={18} />}
                              </li>
                            ))}
                          </ol>
                          <p className="school-answer-explanation">
                            {q.explanation}
                          </p>
                        </>
                      )}
                    </article>
                  ))}
                  {editingQuiz && (
                    <div className="school-edit-actions">
                      <ErrorBox message={error} />
                      <button
                        className="button"
                        disabled={!!busy}
                        onClick={() =>
                          patch(
                            { questions: editingQuiz },
                            "Đã lưu đề khởi động.",
                          )
                        }
                      >
                        Lưu đề
                      </button>
                      <button
                        className="button secondary"
                        disabled={!!busy}
                        onClick={() => setEditingQuiz(null)}
                      >
                        Hủy chỉnh sửa
                      </button>
                    </div>
                  )}
                </section>
              )}
              {tab === "groups" && (
                <section>
                  <div className="school-section-heading">
                    <div>
                      <h2>Hai bài, vừa sức từng nhóm</h2>
                      <p>
                        Xếp từ điểm cao xuống thấp · tối đa 5 học sinh / nhóm
                      </p>
                    </div>
                    <div>
                      {data.plan && (
                        <button
                          className="button secondary"
                          disabled={!!busy}
                          onClick={() => generate(true)}
                        >
                          Chia lại nhóm
                        </button>
                      )}
                      <button
                        className="button"
                        disabled={!!busy || !submitted || !data.published}
                        onClick={() => generate(false)}
                      >
                        {busy === "groups"
                          ? "Đang tạo phiếu…"
                          : data.plan
                            ? "Tiếp tục tạo phiếu"
                            : "Tạo đề luyện tập"}
                      </button>
                      {allReady && (
                        <button
                          className="button secondary"
                          disabled={!!busy}
                          onClick={() => download()}
                        >
                          <Download size={17} />
                          PDF tất cả nhóm
                        </button>
                      )}
                    </div>
                  </div>
                  {data.plan ? (
                    <>
                      <p className="school-help school-plan-note">
                        Chốt {data.plan.participantCount}/
                        {data.plan.memberCount} em lúc{" "}
                        {dateTime(data.plan.createdAt)}. Có thêm kết quả? Thầy
                        cô có thể “Chia lại nhóm” để tạo bộ phiếu mới.
                      </p>
                      <div className="school-group-list">
                        {data.groups.map((g) => (
                          <article key={g.id} className="school-group">
                            <header>
                              <div>
                                <h3>Nhóm {g.number}</h3>
                                <p>
                                  {g.members.length} học sinh · trung bình{" "}
                                  {g.averageScore}/10 · mức{" "}
                                  {difficulties[
                                    g.difficulty
                                  ].label.toLowerCase()}
                                </p>
                              </div>
                              <span className="school-state">
                                {g.status === "ready"
                                  ? "Đã có 2 bài"
                                  : g.status === "generating"
                                    ? "Đang tạo"
                                    : g.status === "error"
                                      ? "Cần thử lại"
                                      : "Chờ tạo"}
                              </span>
                            </header>
                            <ul className="school-group-names">
                              {g.members.map((m) => (
                                <li key={m.uid}>{m.fullName}</li>
                              ))}
                            </ul>
                            {g.status === "ready" ? (
                              <>
                                <ol className="school-group-exercises">
                                  {g.exercises.map((e) => (
                                    <li key={e.number}>
                                      <strong>Bài {e.number}</strong>
                                      <p>{e.problem}</p>
                                    </li>
                                  ))}
                                </ol>
                                <button
                                  className="button secondary"
                                  disabled={!!busy}
                                  onClick={() => download(g.id)}
                                >
                                  <Download size={17} />
                                  Xuất PDF nhóm {g.number}
                                </button>
                              </>
                            ) : (
                              <p className="school-help">
                                {g.status === "generating"
                                  ? "AI đang soạn bài. Nếu lượt trước bị ngắt, thầy cô có thể tiếp tục sau khoảng 2 phút."
                                  : "Nhấn Tiếp tục tạo phiếu để hoàn tất nhóm này."}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="school-group-empty">
                      <FileText size={38} />
                      <h3>Phiếu bắt đầu từ kết quả của các em.</h3>
                      <p>
                        Khi đã có đủ học sinh làm khởi động, thầy cô nhấn “Tạo
                        đề luyện tập”. Nhóm có điểm trung bình từ 8: mức khó; từ
                        5: mức vừa; dưới 5: mức dễ.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </>
          )
        )}
      </div>
    </SchoolGate>
  );
}
