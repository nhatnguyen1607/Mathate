import React, { useState } from "react";
import { Check, Copy, KeyRound, Users } from "lucide-react";
export default function TeacherClassGuide({ data }) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const steps = [
    {
      name: "Tạo lớp học",
      done: true,
      detail: "Tên lớp và mã tham gia đã sẵn sàng.",
    },
    {
      name: "Mời học sinh",
      done: data.members.length > 0,
      detail: data.members.length
        ? `Đã có ${data.members.length} em tham gia.`
        : "Gửi mã lớp để các em cùng vào học.",
    },
    {
      name: "Chuẩn bị chủ đề",
      done: data.activities.length > 0,
      detail: data.activities.length
        ? `${data.activities.length} chủ đề đã được chuẩn bị.`
        : "Chọn nội dung phù hợp với buổi học.",
    },
    {
      name: "Giao khởi động",
      done: data.activities.some((a) => a.published),
      detail: data.activities.some((a) => a.published)
        ? "Theo dõi kết quả để chuẩn bị phiếu nhóm."
        : "Xem lại đề và đáp án trước khi giao.",
    },
  ];
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(
        `Mời em tham gia lớp ${data.classroom.name} trên Mathate!\n1. Đăng nhập tại ${window.location.origin}/classes\n2. Chọn “Tham gia lớp”.\n3. Nhập mã ${data.classroom.code} và họ tên đầy đủ của em.`,
      );
      setCopied(true);
      setError("");
    } catch {
      setError("Chưa sao chép được. Thầy cô có thể dùng mã ở đầu trang.");
    }
  }
  return (
    <aside className="teacher-class-aside">
      <section className="teacher-invite">
        <span className="teacher-invite-icon">
          <KeyRound size={23} />
        </span>
        <h2>Đón các em vào lớp</h2>
        <p>
          Gửi lời mời vào nhóm lớp. Học sinh đăng nhập, chọn{" "}
          <strong>Lớp của mình</strong> rồi nhập mã để tham gia.
        </p>
        <div className="teacher-invite-code">
          <span>Mã lớp</span>
          <strong>{data.classroom.code}</strong>
        </div>
        <button className="button secondary" onClick={copyInvite}>
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? "Đã sao chép lời mời" : "Sao chép lời mời"}
        </button>
        <p className="school-help" role="status">
          {error ||
            "Các em dùng họ tên đầy đủ để thầy cô nhận biết và in trên phiếu nhóm."}
        </p>
      </section>
      <div className="teacher-class-tip">
        <Users size={21} />
        <p>
          Đợi đủ kết quả khởi động rồi tạo phiếu. Hệ thống chia tối đa{" "}
          <strong>5 em / nhóm</strong> và soạn <strong>2 bài</strong> phù hợp
          cho mỗi nhóm.
        </p>
      </div>
    </aside>
  );
}
