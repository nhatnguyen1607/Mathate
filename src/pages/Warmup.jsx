import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { ErrorBox, Mascot, Spinner } from "../components/ui";
import { SchoolGate, dateTime } from "./Classrooms";
import { skillNames } from "../../shared/classrooms";
import useDialog from "../hooks/useDialog";
export default function Warmup() {
  const { classId, activityId } = useParams(),
    { user } = useApp();
  const path = `/classrooms/${classId}/activities/${activityId}`;
  const [activity, setActivity] = useState(null),
    [data, setData] = useState(null),
    [answers, setAnswers] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saveState, setSaveState] = useState("saved"),
    [seconds, setSeconds] = useState(420),
    [current, setCurrent] = useState(0),
    [confirm, setConfirm] = useState(false);
  const clockOffset = useRef(0),
    answersRef = useRef([]),
    revision = useRef(0),
    dirty = useRef(false),
    submitting = useRef(false),
    autosave = useRef(null),
    alive = useRef(true),
    dataRef = useRef(null),
    savedRevision = useRef(0),
    autoTried = useRef(false);
  const cacheKey = data?.attempt
    ? `mathate-warmup:${user?.uid}:${classId}:${activityId}:${data.attempt.startedAt}`
    : null;
  useDialog(confirm, ".school-submit-dialog", () => setConfirm(false), busy);
  const accept = useCallback((value, keepInput = false) => {
    if (
      dataRef.current?.attempt.startedAt === value.attempt.startedAt &&
      dataRef.current?.attempt.status === "submitted" &&
      value.attempt.status !== "submitted"
    )
      return;
    clockOffset.current = value.serverNow - Date.now();
    dataRef.current = value;
    setData(value);
    setActivity(value.activity);
    if (!keepInput || !dirty.current || value.attempt.status === "submitted") {
      answersRef.current = value.attempt.answers;
      setAnswers(value.attempt.answers);
    }
    revision.current = Math.max(
      revision.current,
      value.attempt.revision,
      keepInput ? 0 : Date.now(),
    );
    savedRevision.current = Math.max(
      savedRevision.current,
      value.attempt.revision,
    );
  }, []);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    dataRef.current = null;
    dirty.current = false;
    revision.current = 0;
    savedRevision.current = 0;
    answersRef.current = [];
    autoTried.current = false;
    submitting.current = false;
    setData(null);
    setAnswers([]);
    setSeconds(420);
    setError("");
    setCurrent(0);
    setSaveState("saved");
    setConfirm(false);
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const a = await api(path);
        if (cancelled) return;
        setActivity(a);
        if (a.attempt) {
          const value = await api(`${path}/attempt`);
          if (cancelled) return;
          accept(value);
          if (value.attempt.status !== "submitted") {
            const key = `mathate-warmup:${user.uid}:${classId}:${activityId}:${value.attempt.startedAt}`;
            try {
              const local = JSON.parse(localStorage.getItem(key));
              if (
                local?.revision > value.attempt.revision &&
                Array.isArray(local.answers) &&
                local.answers.length === value.questions.length &&
                local.answers.every(
                  (v) => v === null || (Number.isInteger(v) && v >= 0 && v < 4),
                )
              ) {
                answersRef.current = local.answers;
                setAnswers(local.answers);
                revision.current = local.revision;
                dirty.current = true;
                setSaveState("pending");
              }
            } catch {
              /* Server answers remain available if local storage is unavailable. */
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      alive.current = false;
      clearTimeout(autosave.current);
    };
  }, [path, user?.uid, accept, classId, activityId]);
  async function start() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      accept(await api(`${path}/attempt`, { method: "POST" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const save = useCallback(async () => {
    if (
      !dirty.current ||
      submitting.current ||
      dataRef.current?.attempt.status !== "in_progress"
    )
      return;
    const sentRevision = revision.current,
      sent = [...answersRef.current];
    if (alive.current) setSaveState("saving");
    try {
      const result = await api(`${path}/attempt`, {
        method: "PATCH",
        body: { answers: sent, revision: sentRevision },
      });
      if (!alive.current) return;
      if (result.attempt.status === "submitted") {
        dirty.current = false;
        accept(result);
        setSaveState("saved");
        return;
      }
      savedRevision.current = Math.max(
        savedRevision.current,
        result.attempt.revision,
      );
      if (
        dataRef.current?.attempt.status === "in_progress" &&
        dataRef.current.attempt.expiresAt !== result.attempt.expiresAt
      ) {
        const next = {
          ...dataRef.current,
          attempt: {
            ...dataRef.current.attempt,
            expiresAt: result.attempt.expiresAt,
          },
        };
        dataRef.current = next;
        setData(next);
      }
      if (sentRevision === revision.current) {
        dirty.current = false;
        setSaveState("saved");
      } else setSaveState("pending");
    } catch {
      if (alive.current) setSaveState("error");
    }
  }, [path, accept]);
  useEffect(() => {
    clearTimeout(autosave.current);
    if (data?.attempt.status === "in_progress" && dirty.current)
      autosave.current = setTimeout(save, 400);
    return () => clearTimeout(autosave.current);
  }, [answers, data?.attempt.status, save]);
  useEffect(() => {
    if (!cacheKey) return;
    try {
      if (data.attempt.status === "submitted")
        localStorage.removeItem(cacheKey);
      else if (dirty.current)
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ answers, revision: revision.current }),
        );
    } catch {
      /* Autosave on the server is still active. */
    }
  }, [answers, cacheKey, data?.attempt.status]);
  async function submit(automatic = false) {
    if (
      submitting.current ||
      !dataRef.current ||
      dataRef.current.attempt.status !== "in_progress"
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    clearTimeout(autosave.current);
    try {
      const result = await api(`${path}/attempt/submit`, {
        method: "POST",
        body: { answers: answersRef.current, revision: ++revision.current },
      });
      if (alive.current) {
        dirty.current = false;
        accept(result);
        setSaveState("saved");
        setConfirm(false);
      }
    } catch (e) {
      if (alive.current)
        setError(
          automatic
            ? "Đã hết giờ. Chưa kết nối được để xác nhận kết quả; các câu đã lưu vẫn được giữ. Bạn nhấn “Kiểm tra kết quả” khi có mạng nhé."
            : e.message,
        );
    } finally {
      submitting.current = false;
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (data?.attempt.status !== "in_progress") return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (Date.parse(data.attempt.expiresAt) -
            Date.now() -
            clockOffset.current) /
            1000,
        ),
      );
      setSeconds(remaining);
      if (!remaining && !autoTried.current) {
        autoTried.current = true;
        void submit(true);
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [data?.attempt.status, data?.attempt.expiresAt]);
  useEffect(() => {
    const unload = (e) => {
      if (dirty.current && dataRef.current?.attempt.status === "in_progress") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const online = () => {
      if (dirty.current) void save();
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("online", online);
    };
  }, [save]);
  useEffect(() => {
    if (data?.attempt.status !== "in_progress") return;
    let cancelled = false;
    const check = async () => {
      if (document.hidden || submitting.current) return;
      try {
        const result = await api(`${path}/attempt`);
        if (!cancelled && alive.current && !submitting.current)
          accept(result, true);
      } catch {
        /* Submission and autosave show actionable connection errors. */
      }
    };
    const timer = setInterval(check, 15000);
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [path, data?.attempt.status, accept]);
  const complete = data?.attempt.status === "submitted",
    selected = answers.filter((a) => a !== null).length;
  const expired =
    !data &&
    activity?.deadline &&
    Date.parse(activity.deadline) <= (activity?.serverNow || Date.now());
  function choose(value) {
    if (busy || seconds <= 0 || complete) return;
    const next = answersRef.current.map((v, i) => (i === current ? value : v));
    answersRef.current = next;
    dirty.current = true;
    revision.current = Math.max(revision.current + 1, Date.now());
    setAnswers(next);
    setSaveState("pending");
  }
  return (
    <SchoolGate>
      <div className="school-page school-warmup page-wrap">
        <Link className="back-link" to={`/classes/${classId}`}>
          <ChevronLeft size={18} />
          Về lớp của mình
        </Link>
        <ErrorBox message={error} />
        {loading ? (
          <Spinner text="Đang mở khởi động…" />
        ) : (
          activity && (
            <>
              <header className="school-page-heading">
                <div>
                  <h1>Khởi động · {activity.topic.name}</h1>
                  <p>
                    {complete
                      ? "Một bước nhỏ nữa trên hành trình khám phá!"
                      : "Cứ đọc kỹ và chọn câu trả lời bạn nghĩ là đúng nhé."}
                  </p>
                </div>
              </header>
              {!data ? (
                <div className="school-warmup-intro">
                  <Mascot pose="happy" />
                  <div>
                    <h2>
                      {expired
                        ? "Khởi động đã hết hạn."
                        : "Sẵn sàng khởi động cùng mình?"}
                    </h2>
                    <ul>
                      <li>
                        <Check size={18} />8 câu trắc nghiệm, mỗi câu chọn 1 đáp
                        án.
                      </li>
                      <li>
                        <Clock3 size={18} />
                        Tối đa 7 phút, tính từ khi bạn nhấn bắt đầu.
                      </li>
                      <li>
                        <ShieldCheck size={18} />
                        Chỉ làm 1 lần. Tải lại trang vẫn tiếp tục thời gian cũ.
                      </li>
                    </ul>
                    <p>
                      Hạn nộp: {dateTime(activity.deadline)}. Nếu hạn đến trước,
                      bài sẽ kết thúc sớm hơn 7 phút.
                    </p>
                    <button
                      className="button"
                      disabled={busy || expired}
                      onClick={start}
                    >
                      {busy
                        ? "Đang mở bài…"
                        : expired
                          ? "Đã hết hạn"
                          : "Bắt đầu khởi động"}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : complete ? (
                <section className="school-warmup-result">
                  <div className="school-result-summary">
                    <Mascot pose="happy" />
                    <div>
                      <span className="school-result-check">
                        <Check size={24} />
                      </span>
                      <h2>Đã ghi nhận bài của bạn!</h2>
                      <p className="school-result-score">
                        {data.attempt.result.score}
                        <span>/10 điểm</span>
                      </p>
                      <p>
                        Bạn trả lời đúng {data.attempt.result.correct}/
                        {data.attempt.result.total} câu.
                        {data.attempt.autoSubmitted
                          ? " Bài được chốt khi hết thời gian hoặc đến hạn."
                          : ""}
                      </p>
                      <p>
                        Thầy cô sẽ dùng kết quả để chuẩn bị những bài luyện tập
                        phù hợp với bạn.
                      </p>
                    </div>
                  </div>
                  <section
                    className="school-result-skills"
                    aria-labelledby="school-result-skills-title"
                  >
                    <h2 id="school-result-skills-title">
                      Kết quả từng kỹ năng
                    </h2>
                    <dl className="school-skill-results">
                      {Object.entries(data.attempt.result.skills).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt>{skillNames[key]}</dt>
                            <dd>
                              <strong>
                                {value.correct}/{value.total}
                              </strong>{" "}
                              câu đúng
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </section>
                  <div className="school-result-actions">
                    <Link className="button" to={`/classes/${classId}`}>
                      Về lớp của mình
                      <ArrowRight size={18} />
                    </Link>
                    <p className="school-help">
                      Bạn đã hoàn thành lượt khởi động duy nhất của chủ đề này.
                    </p>
                  </div>
                </section>
              ) : (
                <>
                  <div className="school-quiz-toolbar">
                    <div
                      className={`school-timer ${seconds <= 60 ? "is-urgent" : ""}`}
                      role="timer"
                      aria-label={`Còn ${Math.floor(seconds / 60)} phút ${seconds % 60} giây`}
                    >
                      <Clock3 size={22} />
                      <strong>
                        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                        {String(seconds % 60).padStart(2, "0")}
                      </strong>
                      <span>thời gian còn lại</span>
                    </div>
                    <p>
                      Đã chọn{" "}
                      <strong>
                        {selected}/{data.questions.length}
                      </strong>{" "}
                      câu
                    </p>
                    <div className="school-save-state" role="status">
                      <Check size={17} />
                      {saveState === "error" ? (
                        <button className="text-button" onClick={save}>
                          Chưa lưu được · Thử lại
                        </button>
                      ) : saveState === "saved" ? (
                        "Đã lưu câu trả lời"
                      ) : (
                        "Đang lưu…"
                      )}
                    </div>
                  </div>
                  {saveState === "error" && (
                    <p className="school-help">
                      Câu trả lời đang giữ trên máy này. Giữ trang mở và kết nối
                      lại mạng để lưu trước khi hết giờ nhé.
                    </p>
                  )}
                  <nav
                    className="school-question-nav"
                    aria-label="Chọn câu hỏi"
                  >
                    {data.questions.map((q, i) => (
                      <button
                        key={q.id}
                        className={`${i === current ? "is-current" : ""} ${answers[i] !== null ? "is-answered" : ""}`}
                        aria-current={i === current ? "step" : undefined}
                        aria-label={`Câu ${i + 1}${answers[i] !== null ? ", đã chọn đáp án" : ", chưa trả lời"}`}
                        onClick={() => setCurrent(i)}
                      >
                        {i + 1}
                        {answers[i] !== null && <Check size={12} />}
                      </button>
                    ))}
                  </nav>
                  <fieldset
                    className="school-quiz-question"
                    disabled={busy || seconds <= 0}
                  >
                    <legend>
                      Câu {current + 1} / {data.questions.length}
                    </legend>
                    <h2 id="school-question-text">
                      {data.questions[current].text}
                    </h2>
                    <div
                      className="school-answer-choices"
                      role="radiogroup"
                      aria-labelledby="school-question-text"
                    >
                      {data.questions[current].options.map((option, i) => (
                        <label
                          key={`${current}-${i}`}
                          className={
                            answers[current] === i ? "is-selected" : ""
                          }
                        >
                          <input
                            type="radio"
                            name={`question-${current}`}
                            value={i}
                            checked={answers[current] === i}
                            onChange={() => choose(i)}
                          />
                          <b>{String.fromCharCode(65 + i)}</b>
                          <span>{option}</span>
                          {answers[current] === i && <Check size={21} />}
                        </label>
                      ))}
                    </div>
                    <button
                      className="text-button"
                      disabled={answers[current] === null}
                      onClick={() => choose(null)}
                    >
                      Bỏ chọn câu này
                    </button>
                  </fieldset>
                  <div className="school-quiz-actions">
                    <button
                      className="button secondary"
                      disabled={current === 0}
                      onClick={() => setCurrent((n) => n - 1)}
                    >
                      <ArrowLeft size={17} />
                      Câu trước
                    </button>
                    <div>
                      {current < data.questions.length - 1 && (
                        <button
                          className="button secondary"
                          onClick={() => setCurrent((n) => n + 1)}
                        >
                          Câu tiếp
                          <ArrowRight size={17} />
                        </button>
                      )}
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() =>
                          seconds <= 0 ? submit(true) : setConfirm(true)
                        }
                      >
                        <Send size={17} />
                        {busy
                          ? "Đang nộp…"
                          : seconds <= 0
                            ? "Kiểm tra kết quả"
                            : "Nộp khởi động"}
                      </button>
                    </div>
                  </div>
                  <p className="school-help">
                    Không trừ điểm khi trả lời sai. Bạn có thể xem lại các câu
                    trước khi nộp.
                  </p>
                </>
              )}
            </>
          )
        )}
        {confirm && (
          <div className="school-dialog-scrim">
            <section
              className="school-submit-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="school-submit-title"
            >
              <h2 id="school-submit-title">Nộp bài khởi động nhé?</h2>
              <p>
                Bạn đã chọn {selected}/{data.questions.length} câu.
                {selected < data.questions.length
                  ? ` Còn ${data.questions.length - selected} câu chưa trả lời, các câu này được 0 điểm.`
                  : " Bạn đã trả lời đủ các câu."}{" "}
                Sau khi nộp, bạn không thể làm lại.
              </p>
              <ErrorBox message={error} />
              <div>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Xem lại bài
                </button>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => submit(false)}
                >
                  {busy ? "Đang nộp…" : "Nộp bài"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </SchoolGate>
  );
}
