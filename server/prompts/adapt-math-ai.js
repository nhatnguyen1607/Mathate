// Only product dependencies are removed here; no replacement teaching rules.
// These names select the original difficulty branches, not a student's assessment.
export const difficultyBranches = Object.freeze({
  easy: "Cần cố gắng",
  medium: "Đạt",
  hard: "Tốt",
});
export function adaptTutorPrompt(text) {
  return text
    .replaceAll("HS lớp 5", "bạn")
    .replaceAll("học sinh lớp 5", "bạn")
    .replace(
      /^VAI TRÒ CỦA BẠN:.*\r?\n- Nhiệm vụ nhập vai:.*\r?\n- Hãy xưng hô thân thiện, nhất quán với vai trò này\.\r?\n/gm,
      "",
    );
}
export function adaptPracticePrompt(text, difficulty) {
  if (!Object.hasOwn(difficultyBranches, difficulty))
    throw new Error("Độ khó không hợp lệ.");
  return text
    .replaceAll("Bạn là giáo viên toán lớp 5", "Bạn là giáo viên toán tiểu học")
    .replaceAll("Toán về số thập phân lớp 5.", "Toán về số thập phân.")
    .replaceAll("Toán về tỉ số lớp 5.", "Toán về tỉ số.")
    .replaceAll("Toán chuyển động đều lớp 5.", "Toán chuyển động đều.")
    .replaceAll(
      "CHO LỚP 5 + TUÂN THEO HƯỚNG DẪN TRÊN",
      "THEO ĐỘ KHÓ ĐÃ CHỌN + TUÂN THEO HƯỚNG DẪN TRÊN",
    )
    .replace("BÀI KHỞI ĐỘNG (MẪU):\n\n", "")
    .replace(
      "Tạo BÀI LUYỆN TẬP dựa vào bài khởi động trên:",
      "Tạo BÀI LUYỆN TẬP:",
    )
    .replaceAll("MỨC ĐỘ BÀI 1 - CỰC DỄ (Học sinh Cần cố gắng)", "ĐỘ KHÓ DỄ")
    .replaceAll(
      "MỨC ĐỘ BÀI 1 - PHỨC TẠP HƠN KHỞI ĐỘNG (Học sinh Tốt)",
      "ĐỘ KHÓ KHÓ",
    )
    .replaceAll(
      "MỨC ĐỘ BÀI 1 - TƯƠNG ĐƯƠNG KHỞI ĐỘNG (Học sinh Đạt)",
      "ĐỘ KHÓ VỪA",
    )
    .replace(/^- BÀI 1 PHẢI KHÓ HƠN khởi động[^\r\n]*\r?\n/gm, "")
    .replace(/^- Giữ ĐỘ KHÓ TƯƠNG ĐƯƠNG bài 1 khởi động\r?\n/gm, "")
    .replace(
      /^6\. ✅ THAY ĐỔI BỐI CẢNH nhưng giữ nguyên CẤU TRÚC TOÁN HỌC\r?\n/gm,
      "",
    )
    .replaceAll("Học sinh Cần cố gắng", "Độ khó Dễ")
    .replaceAll("Học sinh Đạt", "Độ khó Vừa")
    .replaceAll("Học sinh Tốt", "Độ khó Khó")
    .replaceAll("Cần cố gắng", "Dễ")
    .replaceAll("mức Tốt", "mức Khó")
    .replaceAll("mức Đạt", "mức Vừa")
    .replace("[TIẾN TRÌNH & RÀNG BUỘC KỸ THUẬT]\n", "")
    .replace(/^Bài \d+:[^\r\n]*->[^\r\n]*\r?\n/gm, "")
    .replace(
      /^1\. TUYỆT ĐỐI KHÔNG dùng khái niệm[^\r\n]*các bài học đứng sau[^\r\n]*\r?\n/gm,
      "",
    )
    .replace(/ \(Ví dụ: Đang ở bài 40[^\r\n]*bài 41\)\./g, "")
    .replaceAll("[ĐÁNH GIÁ NĂNG LỰC & ĐỘ KHÓ]", "[ĐỘ KHÓ ĐÃ CHỌN]")
    .replace(
      /\s*═+\r?\n\s*BOI CANH VA TUYEN NHAN VAT[\s\S]*?(?=\[YÊU CẦU ĐẦU RA JSON BẮT BUỘC\])/gu,
      "\n\n",
    );
}
