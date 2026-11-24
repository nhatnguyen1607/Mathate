import { useCompanion } from "../context/AppearanceContext";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Lightbulb,
  Check,
  Star,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../lib/api";
import { speak, stopSpeech } from "../lib/speech";
import { useApp } from "../context/AppContext";
import { steps, difficulties } from "../../shared/catalog";
import { TopicIcon, ErrorBox, Spinner, Mascot } from "../components/ui";
import RobotCompanion from "../components/RobotCompanion";
import TypewriterMessage from "../components/TypewriterMessage";
import { TTS_TEXT_FALLBACK_MS, speechText } from "../../shared/playback.js";
export default function Practice() {
  const { copy } = useCompanion();
  const { id } = useParams(),
    { user, demo, ready, refresh } = useApp();
  const [session, setSession] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [input, setInput] = useState(""),
    [speaking, setSpeaking] = useState(null),
    [listening, setListening] = useState(false),
    [typingMessage, setTypingMessage] = useState(null),
    [typingPaused, setTypingPaused] = useState(false),
    [speechError, setSpeechError] = useState(""),
    [autoRead, setAutoRead] = useState(
      () => localStorage.getItem("mathate-auto-read") !== "false",
    ),
    [speechPhase, setSpeechPhase] = useState("idle"),
    [voiceGender, setVoiceGender] = useState(() =>
      localStorage.getItem("mathate-tts-gender") === "MALE" ? "MALE" : "FEMALE",
    );
  const bottom = useRef(null),
    recognition = useRef(null),
    request = useRef(null),
    mounted = useRef(true),
    sendingRef = useRef(false),
    readingRequest = useRef(0),
    typingTimer = useRef(null),
    seenReplies = useRef({
      sessionId: null,
      lastId: null,
    });
  const scrollToBottom = useCallback(() => {
    const box = bottom.current?.parentElement;
    if (box)
      box.scrollTo({
        top: box.scrollHeight,
        behavior: "instant",
      });
  }, []);
  function clearTypingTimer() {
    clearTimeout(typingTimer.current);
    typingTimer.current = null;
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      setSession(await api(`/sessions/${id}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    if (ready && (user || demo)) load();
    return () => {
      mounted.current = false;
      readingRequest.current++;
      clearTypingTimer();
      stopSpeech();
      recognition.current?.abort();
    };
  }, [id, ready, user?.uid, demo]);
  useEffect(() => {
    const box = bottom.current?.parentElement;
    if (box)
      box.scrollTo({
        top: box.scrollHeight,
        behavior: "smooth",
      });
  }, [session?.messages.length, sending]);
  const lastReply = session?.messages
    .filter((message) => message.role === "model")
    .at(-1);
  useEffect(() => {
    if (!session || session.id !== id || !lastReply) return;
    const previous = seenReplies.current;
    if (previous.sessionId === id && previous.lastId === lastReply.id) return;
    const firstVisit = previous.sessionId !== id;
    seenReplies.current = {
      sessionId: id,
      lastId: lastReply.id,
    };
    // Do not replay old conversations; welcome is presented once per browser session.
    if (firstVisit) {
      const welcomeKey = `mathate-welcome:${id}`;
      if (session.messages.length !== 1 || sessionStorage.getItem(welcomeKey))
        return;
      sessionStorage.setItem(welcomeKey, "seen");
    }
    if (autoRead) {
      void read(lastReply.text, lastReply.id, true);
    } else {
      setTypingMessage(lastReply.id);
      setTypingPaused(false);
    }
  }, [session?.id, lastReply?.id, id]);
  async function send(hint = false) {
    const text = hint ? copy("Mimo ơi, cho mình một gợi ý nhé.") : input.trim();
    if (!text || sendingRef.current || session?.completed) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    readingRequest.current++;
    clearTypingTimer();
    stopSpeech();
    setSpeaking(null);
    setSpeechPhase("idle");
    setSpeechError("");
    setTypingMessage(null);
    setTypingPaused(false);
    recognition.current?.stop();
    if (
      !request.current ||
      request.current.text !== text ||
      request.current.hint !== hint
    )
      request.current = {
        text,
        hint,
        id: crypto.randomUUID(),
      };
    const optimisticId = `pending-${request.current.id}`;
    // Render the learner's message before waiting for the AI round trip.
    setSession((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: optimisticId,
          role: "user",
          text,
        },
      ],
    }));
    if (!hint) setInput("");
    try {
      const result = await api(`/sessions/${id}/messages`, {
        method: "POST",
        body: {
          message: text,
          hint,
          requestId: request.current.id,
        },
      });
      if (!mounted.current) return;
      // The server response replaces the optimistic copy with persisted messages.
      setSession(result);
      request.current = null;
      if (result.completed) {
        refresh();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          confetti({
            particleCount: 65,
            spread: 65,
            colors: ["#438c5f", "#edbd5b", "#ae96cf"],
            origin: {
              y: 0.65,
            },
          });
      }
    } catch (e) {
      if (mounted.current) {
        setSession((current) => ({
          ...current,
          messages: current.messages.filter(
            (message) => message.id !== optimisticId,
          ),
        }));
        if (!hint) setInput(text);
        setError(e.message);
      }
    } finally {
      sendingRef.current = false;
      if (mounted.current) setSending(false);
    }
  }
  async function read(text, key, autoStartTypewriter = false) {
    clearTypingTimer();
    if (speaking === key && !autoStartTypewriter) {
      readingRequest.current++;
      stopSpeech();
      setSpeaking(null);
      setSpeechPhase("idle");
      setTypingPaused(false);
      return;
    }
    const ownRequest = ++readingRequest.current;
    setSpeechError("");
    setSpeaking(key);
    setSpeechPhase("loading");
    let typewriterStarted = false;
    const startTyping = () => {
      if (
        !autoStartTypewriter ||
        typewriterStarted ||
        !mounted.current ||
        ownRequest !== readingRequest.current
      )
        return;
      typewriterStarted = true;
      setTypingMessage(key);
      setTypingPaused(false);
    };
    if (autoStartTypewriter) {
      setTypingMessage(key);
      setTypingPaused(true);
      typingTimer.current = setTimeout(startTyping, TTS_TEXT_FALLBACK_MS);
    } else setTypingPaused(false);
    const done = () => {
      if (mounted.current && ownRequest === readingRequest.current) {
        clearTypingTimer();
        startTyping();
        setSpeaking(null);
        setSpeechPhase("idle");
      }
    };
    const fail = (e) => {
      if (mounted.current && ownRequest === readingRequest.current) {
        clearTypingTimer();
        setSpeechError(
          e.name === "NotAllowedError"
            ? "Trình duyệt đang chặn tự đọc. Bạn nhấn nút loa để nghe nhé."
            : e.message,
        );
        startTyping();
        done();
      }
    };
    try {
      await speak(key === "problem" ? copy(text) : speechText(copy(text)), {
        voiceGender,
        onStart: () => {
          if (mounted.current && ownRequest === readingRequest.current) {
            clearTypingTimer();
            startTyping();
            setSpeechPhase("playing");
          }
        },
        onEnd: done,
        onError: fail,
      });
    } catch (e) {
      fail(e);
    }
  }
  function toggleAutoRead() {
    const enabled = !autoRead;
    setAutoRead(enabled);
    localStorage.setItem("mathate-auto-read", String(enabled));
    if (!enabled) {
      readingRequest.current++;
      clearTypingTimer();
      stopSpeech();
      setSpeaking(null);
      setSpeechPhase("idle");
      setTypingPaused(false);
    }
  }
  function selectVoice(value) {
    if (speaking !== null) return;
    setVoiceGender(value);
    localStorage.setItem("mathate-tts-gender", value);
  }
  function record() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        "Trình duyệt chưa hỗ trợ nhập giọng nói. Bạn dùng bàn phím hoặc thử Chrome/Edge nhé.",
      );
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "vi-VN";
    r.continuous = false;
    r.interimResults = false;
    recognition.current = r;
    r.onresult = (e) =>
      setInput((old) => `${old}${old ? " " : ""}${e.results[0][0].transcript}`);
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setError(
        "Chưa nghe được giọng bạn. Kiểm tra quyền micro rồi thử lại nhé.",
      );
    };
    r.start();
    setListening(true);
  }
  if (!ready) return <Spinner text="Đang mở hành trình của bạn…" />;
  if (!user && !demo)
    return (
      <div className="page-wrap">
        <ErrorBox message="Bạn đăng nhập hoặc chọn chơi thử để mở bài học." />
        <Link className="button" to="/login">
          Đăng nhập
        </Link>
      </div>
    );
  if (loading) return <Spinner text={copy("Mimo đang mở bài học…")} />;
  if (!session)
    return (
      <div className="page-wrap">
        <ErrorBox message={error} retry={load} />
        <Link to="/" className="text-button">
          Về khám phá
        </Link>
      </div>
    );
  return (
    <div className="practice-page page-wrap">
      <div className="practice-top">
        <Link
          to={session.classId ? `/classes/${session.classId}` : "/"}
          className="back-link"
        >
          <ChevronLeft size={18} />
          {session.classId ? "Về lớp của mình" : "Về khám phá"}
        </Link>
        <span className="practice-difficulty">
          <LeafIcon />
          {difficulties[session.difficulty].label} · tối đa{" "}
          {difficulties[session.difficulty].xp} XP
        </span>
      </div>
      {demo && (
        <div className="preview-notice demo">
          Chế độ chơi thử · Bài mẫu và phản hồi theo kịch bản, không gọi AI.
        </div>
      )}
      <div className="practice-layout">
        <div className="practice-main">
          <section className="problem-panel">
            <div className="problem-heading">
              <span className={`topic-icon tiny ${session.topic.color}`}>
                <TopicIcon name={session.topic.icon} size={21} />
              </span>
              <strong>{session.topic.name}</strong>
              <button
                className="icon-button"
                onClick={() => read(session.problem, "problem")}
                aria-label={
                  speaking === "problem" ? "Dừng đọc đề" : "Nghe đọc đề"
                }
              >
                {speaking === "problem" ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
            </div>
            <h1>{copy(session.title)}</h1>
            <p className="problem-text">{copy(session.problem)}</p>
          </section>
          <section
            className="chat-panel"
            aria-label={copy("Hội thoại cùng Mimo")}
          >
            <div className="chat-heading">
              <span className="bot-avatar">
                <Mascot alt="" />
              </span>
              <div>
                <h2>{copy("Cùng Mimo giải nào!")}</h2>
                <p>Cứ nghĩ thật chậm, mình luôn ở đây.</p>
              </div>
              <span className="chat-status">
                {sending ? "Đang suy nghĩ…" : "Sẵn sàng đồng hành"}
              </span>
            </div>
            <div
              className="chat-messages"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {session.messages.map((m) => (
                <div key={m.id} className={`message ${m.role}`}>
                  <span className="message-author">
                    {m.role === "model" ? copy("Mimo") : "Bạn"}
                  </span>
                  <div className="message-bubble">
                    {m.role === "model" && m.id === typingMessage ? (
                      <TypewriterMessage
                        text={copy(m.text)}
                        paused={typingPaused}
                        onComplete={() =>
                          setTypingMessage((current) =>
                            current === m.id ? null : current,
                          )
                        }
                        onTextUpdate={scrollToBottom}
                      />
                    ) : (
                      <p>{m.role === "model" ? copy(m.text) : m.text}</p>
                    )}
                    {m.role === "model" && (
                      <button
                        className={`message-speak ${speaking === m.id ? "active" : ""}`}
                        aria-label={
                          speaking === m.id ? "Dừng đọc" : copy("Nghe Mimo đọc")
                        }
                        onClick={() => read(m.text, m.id)}
                      >
                        {speaking === m.id && speechPhase === "loading" ? (
                          <LoaderCircle size={16} className="spin" />
                        ) : speaking === m.id ? (
                          <VolumeX size={16} />
                        ) : (
                          <Volume2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="message model">
                  <span className="message-author">{copy("Mimo")}</span>
                  <div className="thinking-bubble" role="status">
                    <span />
                    <span />
                    <span />
                    <small>Đang nghĩ cùng bạn…</small>
                  </div>
                </div>
              )}
              <div ref={bottom} />
            </div>
            <ErrorBox message={error} />
            {session.completed ? (
              <div className="completion-banner">
                <span className="completion-star">
                  <Star size={28} />
                </span>
                <div>
                  <h3>Bạn đã làm được rồi!</h3>
                  <p>
                    +{session.xp} XP{demo ? " trải nghiệm" : ""} cho một lần
                    khám phá thật tuyệt.
                  </p>
                </div>
                <Link className="button" to="/">
                  Khám phá tiếp
                </Link>
              </div>
            ) : (
              <div className="chat-compose">
                <button
                  className="hint-button"
                  onClick={() => send(true)}
                  disabled={sending}
                >
                  <Lightbulb size={17} />
                  Mình cần gợi ý
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <textarea
                    aria-label="Câu trả lời của bạn"
                    placeholder="Viết suy nghĩ của bạn ở đây…"
                    value={input}
                    maxLength={2000}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                    rows={2}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <div className="compose-actions">
                    <button
                      type="button"
                      className={`icon-button ${listening ? "recording" : ""}`}
                      onClick={record}
                      disabled={sending}
                      aria-label={
                        listening ? "Dừng ghi âm" : "Nhập bằng giọng nói"
                      }
                    >
                      {listening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                      className="send-button"
                      type="submit"
                      disabled={sending || !input.trim()}
                      aria-label="Gửi câu trả lời"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
                <small>
                  {copy(
                    "\n                  Mimo có thể nhầm. Mình cùng kiểm tra phép tính nhé!\n                ",
                  )}
                </small>
              </div>
            )}
          </section>
        </div>
        <aside className="practice-aside">
          <div className="companion-panel">
            <RobotCompanion
              status={sending ? "thinking" : session.robotStatus}
              isSpeaking={speechPhase === "playing"}
            />
            <strong>
              {session.completed
                ? copy("Mimo tự hào về bạn!")
                : speechPhase === "playing"
                  ? copy("Mimo đang đọc cho bạn nghe…")
                  : sending
                    ? "Mình cùng suy nghĩ nhé…"
                    : copy("Có Mimo ở đây rồi!")}
            </strong>
            <fieldset className="voice-picker" disabled={speaking !== null}>
              <legend>
                <Volume2 size={15} /> Giọng đọc tiếng Việt
              </legend>
              <div>
                {[
                  ["FEMALE", "Giọng nữ"],
                  ["MALE", "Giọng nam"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={voiceGender === value ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="voiceGender"
                      value={value}
                      checked={voiceGender === value}
                      onChange={() => selectVoice(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p role="status">
                {speechError ||
                  (speechPhase === "loading"
                    ? "Đang chuẩn bị giọng Việt…"
                    : speechPhase === "playing"
                      ? "Nhấn lại loa để dừng và đổi giọng."
                      : "Chọn giọng bạn thích, rồi nhấn loa nhé.")}
              </p>
            </fieldset>
            <button
              type="button"
              className="auto-read-toggle"
              aria-pressed={autoRead}
              onClick={toggleAutoRead}
            >
              {autoRead ? <Volume2 size={16} /> : <VolumeX size={16} />}Tự đọc:{" "}
              {autoRead ? "bật" : "tắt"}
            </button>
          </div>
          <section className="learning-steps">
            <h2>Từng bước, mình sẽ làm được</h2>
            <ol>
              {steps.map((label, index) => (
                <li
                  key={label}
                  className={
                    index + 1 < session.step || session.completed
                      ? "done"
                      : index + 1 === session.step
                        ? "current"
                        : ""
                  }
                >
                  <span>
                    {index + 1 < session.step || session.completed ? (
                      <Check size={17} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <strong>{label}</strong>
                </li>
              ))}
            </ol>
            <p>
              <Lightbulb size={16} /> Cần gợi ý cũng là một cách để học!
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
function LeafIcon() {
  return <Sparkles size={16} />;
}
