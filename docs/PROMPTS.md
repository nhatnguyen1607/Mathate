# Prompt nằm ở đâu và được giữ nguyên như thế nào?

## Nguồn gốc — không viết lại prompt

Các file dưới đây được copy từ `../Math-AI/src/services/gemini/`. Nội dung giữ nguyên; chỉ đổi đường dẫn import cho Node ESM và thêm một dòng chú thích nguồn. Có kiểm thử so sánh toàn bộ file, không chỉ kiểm tra vài từ khóa.

| Loại | File trong Mathate |
|---|---|
| Tạo đề tổng quát | `server/legacy/gemini/geminiPracticeService.js` |
| Tạo đề thập phân | `server/legacy/gemini/geminiPracticeServiceSoThapPhan.js` |
| Tạo đề tỉ số | `server/legacy/gemini/geminiPracticeServiceTiSo.js` |
| Tạo đề chuyển động | `server/legacy/gemini/geminiPracticeServiceTimeVelocity.js` |
| Chat tổng quát | `server/legacy/gemini/geminiChatService.js` |
| Chat thập phân | `server/legacy/gemini/geminiChatServiceSoThapPhan.js` |
| Chat tỉ số | `server/legacy/gemini/geminiChatServiceTiSo.js` |
| Chat chuyển động | `server/legacy/gemini/geminiChatServiceTimeVelocity.js` |

Prompt tạo đề nằm trong `generateSimilarProblem()`, `_buildSimilarProblemPrompt()` và các hàm `_getDifficultyGuidance()`, `_getLessonSpecificGuidance()`. Prompt chatbot gồm **cả** `_buildSystemPrompt()` lẫn `fullPrompt` trong `processStudentResponse()`; không chỉ dùng mỗi system prompt.

## Điểm nối với Mathate

- `server/services/prompts.js`: chọn service gốc, truyền chủ đề và độ khó, khôi phục trạng thái chatbot và gọi **trực tiếp** `processStudentResponse()` cũ.
- `server/prompts/adapt-math-ai.js`: danh sách thay thế/loại bỏ duy nhất ở cấp văn bản. Không nối thêm đoạn “ĐIỀU CHỈNH MATHATE” để ghi đè quy tắc sư phạm.
- `server/services/ai.js`: gọi Gemini và chuyển định dạng đầu ra bằng JavaScript.
- `server/legacy/gemini/geminiModelManager.js`: thay hạ tầng kết nối cũ bằng transport backend của Mathate; tách trạng thái giữa các request bằng AsyncLocalStorage. File này không chứa prompt mới.

## Chỉ những phần sau được thay cho sản phẩm mới

1. **Độ khó do người dùng chọn**: Dễ / Vừa / Khó chọn trực tiếp nhánh dễ / trung bình / khó đã có trong service cũ. Ba nhãn nội bộ `Cần cố gắng / Đạt / Tốt` chỉ là tên nhánh legacy; không đọc điểm khởi động, hồ sơ năng lực hoặc đánh giá học sinh. Shared catalog không còn trường `competency`.
2. **Bỏ phụ thuộc bài khởi động**: không truyền đề mẫu, phần trăm khởi động hay điểm yếu. Bỏ khối nhận xét năng lực từ kết quả khởi động. Giữ nguyên các quy tắc về số liệu, phép tính và ví dụ trong hướng dẫn độ khó.
3. **Mỗi lần một bài độc lập**: bỏ ràng buộc Bài 1/Bài 2 trong kỳ thi, so sánh với bài trước và giới hạn dạng bài theo thứ tự bài. Cả ba mức độ dùng nhánh bài đơn gốc; độ khó được chọn riêng, không giả định bài Khó là “Bài 2”.
4. **Không phân lớp**: bỏ vai trò cố định lớp 5, thứ tự Bài 24→25…, và lệnh không dùng kiến thức của bài đứng sau. Giữ các quy tắc toán học như dấu phẩy thập phân, đơn vị, dữ kiện đầy đủ và không giải hộ.
5. **Không chọn bối cảnh kỳ thi**: bỏ khối bối cảnh/nhân vật bị áp từ cấu hình đề thi, vai thu ngân/cố vấn… và ràng buộc bữa ăn dinh dưỡng. Mathate không tự ép mọi chủ đề vào bếp ăn.
6. **Chỉ dẫn chủ đề admin**: thêm nguyên văn `topic.promptGuidance` vào vị trí hướng dẫn chuyên môn đang có, cùng với hướng dẫn chuyên môn gốc. Không thay thế toàn bộ prompt tạo đề.
7. **Nút “Nộp bài” của giao diện cũ**: chỉ bỏ câu kêu gọi nhấn nút này trong phản hồi cuối. Không bỏ bước kiểm tra/mở rộng của chatbot.

Các chỉnh sửa trên không sửa file legacy. Có thể xem đầy đủ biểu thức thay thế trong `adapt-math-ai.js`; không có bước tóm tắt hoặc viết lại prompt bằng AI.

## Định dạng phản hồi được giữ nguyên

- Tạo đề chuyên biệt: `suy_luan`, `de_bai` như Math-AI.
- Tạo đề tổng quát: văn bản đề bài như Math-AI, không ép sang một JSON khác.
- Chat: `reasoning_process`, `status`, `step_status`, `feedback`, `next_question` như Math-AI. Service gốc xử lý chuyển bước, đếm lần sai và gợi ý.
- Node chuyển kết quả thành `message`, `correct`, `advance`, `complete` cho UI. Không yêu cầu Gemini trả schema UI này thay schema cũ.
- Không yêu cầu thêm `title/answer/solution` vào prompt tạo đề. Tiêu đề dùng tên chủ đề; chatbot kiểm tra lời giải theo luồng gốc từ đề bài và lịch sử.

Trạng thái `wrongAttemptCount`, `step4Phase`, `step4ChangedData` được lưu ở server để giữ gợi ý theo số lần sai và bước kiểm tra hai tầng của service chuyên biệt. Những trạng thái nội bộ này không trả về frontend.

## Kiểm chứng

```powershell
npm run verify:prompts
npm run prompts:export
npm test
```

- Báo cáo đối chiếu 8 file và SHA-256: `docs/PROMPT-PARITY.md`.
- Prompt thực tế sau khi thay các biến đầu vào: `tmp/prompt-review/`. Bao gồm 18 prompt tạo đề, 6 system prompt và 6 prompt lượt chat mẫu. Không gọi AI khi xuất.
- `tests/prompt-parity.test.js` kiểm tra bản sao, nguyên văn system prompt sau các ngoại lệ, nhánh độ khó, trạng thái gợi ý, schema cũ và cô lập nhiều phiên đồng thời.

Nếu cần thay quy tắc sư phạm, nên sửa có chủ đích ở một bản nguồn được quản lý rồi cập nhật đối chiếu; không nối thêm một đoạn ưu tiên cao hơn để âm thầm đổi hành vi.
