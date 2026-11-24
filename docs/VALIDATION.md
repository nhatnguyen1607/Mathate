# Kết quả kiểm chứng

Ngày 24/11/2026. Dự án local: `D:/Math-AI/Mathate`.

| Kiểm tra | Kết quả |
|---|---|
| `npm test` | 15/15 kiểm thử đạt: API, prompt nguyên văn, scaffolding, TTS nam/nữ, cache và chống lượt đọc cũ |
| Prompt | 8/8 file khớp nguồn gốc; 6 chủ đề × 3 mức độ dùng prompt gốc qua bộ thay thế có giới hạn |
| Gemini thật | Đã kiểm tra lại cả service tổng quát và thập phân: tạo đề + lượt chat thành công; đề tổng quát là văn bản, đề thập phân dùng de_bai, JSON chat giữ schema Math-AI |
| Gợi ý | Dùng nguyên logic scaffolding trong processStudentResponse; không còn suffix ghi đè hành vi |
| Browser desktop | Dashboard tải mascot, font Nunito Variable và danh mục chủ đề |
| Browser mobile | Kiểm tra ở 390 × 844, không thấy tràn ngang hoặc ảnh hỏng |
| Luồng tương tác | Chơi thử → chủ đề Số & phép tính → Dễ → 4 lượt giải → hoàn thành |
| Tiến bộ | Nhận 20 XP trải nghiệm; tăng ngày học; nhận huy hiệu đầu tiên |
| Mobile menu | Mở menu, chuyển sang bộ sưu tập, đóng menu và trả focus |
| Bàn phím | Hộp độ khó nhận focus, giữ focus bên trong, hỗ trợ Escape |
| Tìm kiếm | Lọc Hình học, trạng thái không tìm thấy, nút xóa lọc hoạt động |
| Đăng nhập UI | Kiểm tra bố cục desktop và mobile; chưa đăng nhập tài khoản thật |
| Cloud TTS | Cả vi-VN-Wavenet-A/FEMALE và vi-VN-Wavenet-B/MALE trả MP3 thành công bằng tài khoản TTS Math-AI đã được chủ dự án cho phép dùng lại |
| TTS trên trình duyệt | Phát giọng nữ và nam; Mimo hiển thị trạng thái đang đọc; nút dừng mở lại bộ chọn giọng; lựa chọn nam được giữ khi mở bài mới |
| Avatar Mimo | Dùng đúng ảnh Mimo, nút chào hoạt động; kiểm tra desktop và mobile 390 px không tràn ngang |
| Build | `npm run build` thành công; Spline không còn được import vào khung chat, không còn chunk runtime 3D |

Các kiểm tra bổ sung đóng gói trong `scripts/check-release.mjs`: production không mở demo kể cả cấu hình DEMO_MODE=true, API chặn khách, các route SPA trả HTML, bản frontend không chứa khóa AI/private key.

Trong lúc chỉnh trực tiếp, Vite từng tái tạo root và phát sinh lỗi HMR; đã thêm dispose root ở entry để xử lý thay thế root khi phát triển. Bản tải trang đầy đủ và production build đã hiển thị được. Ảnh bàn giao: `docs/dashboard-preview.jpg`.

Đã phân biệt rõ chế độ demo và AI thật. Kiểm thử trình duyệt dùng bài mẫu cục bộ, không tự tạo tài khoản trẻ hay ghi dữ liệu học tập giả lên Firebase.

Chưa xác minh được Firebase Authentication với tài khoản thật, ghi Firestore và admin CRUD trên Firebase thật do chưa có credentials Firebase Admin Mathate. Cloud TTS đã được xác minh riêng bằng tài khoản Math-AI theo xác nhận của chủ dự án. Không thực hiện deploy Firestore rules/indexes hoặc public hosting. Mặc định chưa bật Analytics.

Giới hạn: AI chưa có bộ tính toán độc lập để kiểm chứng tất cả đáp án; cần đánh giá chất lượng nội dung trước public launch. Giọng đọc yêu cầu Cloud TTS đã cấu hình, không fallback tiếng Anh. Mimo hiện là ảnh có chuyển động CSS, chưa phải model 3D riêng. Ảnh xem trước: `docs/mimo-tts-preview.jpg`. Demo dùng bộ nhớ máy chủ, có thể mất bài khi máy chủ khởi động lại.
