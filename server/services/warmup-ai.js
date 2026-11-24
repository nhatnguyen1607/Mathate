import { z } from "zod";
import { randomUUID } from "node:crypto";
import { generateJSON } from "./gemini.js";
import { QUESTION_COUNT } from "../../shared/classrooms.js";
export const warmupQuestionSchema = z.object({
  text: z.string().trim().min(5).max(700),
  options: z
    .array(z.string().trim().min(1).max(200))
    .length(4)
    .refine((a) => new Set(a).size === 4),
  correctIndex: z.number().int().min(0).max(3),
  skill: z.enum(["understand", "plan", "calculate", "check"]),
  explanation: z.string().trim().min(5).max(1200),
});
export function warmupPrompt(topic) {
  return `Bạn là giáo viên toán tiểu học, soạn phần KHỞI ĐỘNG cho trẻ 6–11 tuổi trong Mathate.
CHỦ ĐỀ: ${topic.name}
NỘI DUNG VÀ GIỚI HẠN: ${topic.promptGuidance}
Tham khảo cấu trúc phiếu học tập Math-AI: hiểu dữ kiện, chọn kế hoạch, thực hiện phép tính và kiểm tra kết quả.
Tạo đúng ${QUESTION_COUNT} câu TRẮC NGHIỆM ĐỘC LẬP để làm trong 7 phút, tăng dần từ nhận biết đến vận dụng vừa phải.
Phân bổ đúng 2 câu cho mỗi kỹ năng: understand (hiểu đề), plan (lập kế hoạch), calculate (tính toán), check (kiểm tra).
Mỗi câu có 4 phương án khác nhau, CHỈ 1 phương án đúng. correctIndex là chỉ số 0–3. Tự tính và kiểm chứng đáp án cùng các phương án nhiễu trước khi xuất. Không câu mơ hồ, không mẹo đánh đố, không dữ kiện thừa, không lệ thuộc câu khác.
Với câu kiểm tra (check), chỉ hỏi một phép kiểm tra CỤ THỂ hoặc chọn phát biểu duy nhất đúng. Không đưa hai cách kiểm tra hợp lệ vào cùng câu: ví dụ a - b = c thì cả b + c = a và a - c = b đều có thể kiểm tra kết quả. Mọi phương án nhiễu phải thực sự sai đối với đúng câu hỏi đã nêu, không chỉ khác cách giải ưu tiên.
Dùng tiếng Việt ngắn gọn, số thập phân dùng dấu phẩy, ký hiệu toán Unicode thông thường; không LaTeX, không HTML. Bối cảnh thân thiện, đơn vị đầy đủ.
Trả JSON duy nhất {"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0,"skill":"understand","explanation":"Giải thích và phép tính kiểm chứng"}]}.
Không đưa tên học sinh hoặc thông tin cá nhân vào đề.`;
}
export async function generateWarmup(topic) {
  const schema = z.object({
    questions: z
      .array(warmupQuestionSchema)
      .length(QUESTION_COUNT)
      .refine(
        (qs) =>
          new Set(qs.map((q) => q.text)).size === QUESTION_COUNT &&
          ["understand", "plan", "calculate", "check"].every(
            (skill) => qs.filter((q) => q.skill === skill).length === 2,
          ),
      ),
  });
  const result = await generateJSON(warmupPrompt(topic), schema);
  return result.questions.map((q) => ({ ...q, id: randomUUID() }));
}
