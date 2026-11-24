import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Lightbulb,
  LockKeyhole,
  School,
} from "lucide-react";
import { Mascot } from "./ui";
import { useCompanion } from "../context/AppearanceContext";
export function StudentSchoolWelcome({
  inClass = false,
  total = 0,
  completed = 0,
}) {
  const { character } = useCompanion();
  return (
    <section
      className={`student-school-welcome ${inClass && total ? "is-compact" : ""}`}
    >
      <div>
        <h2>
          {inClass
            ? total
              ? "Từng bài toán, mình cùng tiến một bước."
              : "Mình cùng sẵn sàng cho buổi học nhé!"
            : "Học cùng lớp, vui cùng bạn."}
        </h2>
        <p>
          {inClass
            ? total
              ? `Có ${character.name} đồng hành, bạn cứ bình tĩnh đọc đề và thử cách nghĩ của mình.`
              : `Lớp chưa có chủ đề được giao. Trong lúc chờ thầy cô, ${character.name} cùng bạn tìm hiểu cách học trong lớp nhé.`
            : `Mỗi lớp là một góc khám phá mới. Cùng ${character.name} khởi động, suy nghĩ và tìm niềm vui trong toán học.`}
        </p>
        <div className="student-welcome-details">
          {inClass && total ? (
            <span>
              <Check size={17} />
              Đã hoàn thành {completed}/{total} khởi động
            </span>
          ) : (
            <>
              <span>
                <BookOpen size={17} />
                Khởi động cùng lớp
              </span>
              <span>
                <Lightbulb size={17} />
                Giải toán từng bước
              </span>
            </>
          )}
        </div>
      </div>
      <Mascot pose={inClass && !total ? "reading" : "happy"} />
    </section>
  );
}
export default function StudentClassGuide({ inClass = false }) {
  const { character } = useCompanion();
  return (
    <aside className="student-class-guide">
      <section className="student-learning-guide">
        <h2>{inClass ? "Buổi học của mình" : "Trong lớp có gì nhỉ?"}</h2>
        <div className="student-learning-phase">
          <span className="student-phase-icon">
            <BookOpen size={21} />
          </span>
          <div>
            <h3>Khởi động</h3>
            <p>
              Đọc kỹ 8 câu, chọn đáp án và hoàn thành trong 7 phút. Mỗi chủ đề
              chỉ làm một lần nhé.
            </p>
            <span>
              <Clock3 size={14} />7 phút · 8 câu · 1 lượt
            </span>
          </div>
        </div>
        <div className="student-learning-phase">
          <span className="student-phase-icon">
            <Lightbulb size={21} />
          </span>
          <div>
            <h3>Vận dụng</h3>
            <p>
              Cùng {character.name} giải toán, từng bước một. Cần thêm ý tưởng?
              Bạn có thể xin một gợi ý.
            </p>
            <span>
              <LockKeyhole size={14} />
              Mở khi thầy cô cho phép
            </span>
          </div>
        </div>
      </section>
      <div className="student-learning-note">
        <Check size={19} />
        <p>
          Cứ thử cách nghĩ của bạn. Trả lời sai không bị trừ điểm, và bạn chỉ
          nhìn thấy kết quả của mình.
        </p>
      </div>
    </aside>
  );
}
export function StudentWaitingTopics({ onRefresh }) {
  return (
    <div className="student-waiting-topics">
      <span className="student-waiting-icon">
        <School size={29} />
      </span>
      <h3>Thầy cô đang chuẩn bị chủ đề</h3>
      <p>
        Khi thầy cô giao khởi động, các chủ đề sẽ xuất hiện ở đây. Bạn nhấn “Làm
        mới” để kiểm tra nhé.
      </p>
      <button className="button secondary" onClick={onRefresh}>
        Kiểm tra chủ đề mới
        <ArrowRight size={17} />
      </button>
      <div className="student-while-waiting">
        <Lightbulb size={21} />
        <div>
          <strong>Trong lúc chờ, mình ôn lại một chút nhé?</strong>
          <p>
            Bạn có thể tự chọn chủ đề ở góc Khám phá, ngoài bài học của lớp.
          </p>
          <Link className="text-button" to="/">
            Ghé góc Khám phá <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
