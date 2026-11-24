# Tài khoản và diện mạo Mathate

`/account` nằm trong sidebar và liên kết ảnh đại diện trên thanh trên cùng. Người dùng chỉnh tên, nickname, avatar, nhân vật đồng hành và màu chủ đạo. Nickname ưu tiên trong lời chào; tên vẫn lưu riêng. Lựa chọn lưu vào `users/{uid}` qua API, không dựa vào localStorage chung giữa các tài khoản.

## Nhân vật và màu

Mimo (khủng long), Bông (thỏ), Miu (mèo) và Bắp (cún). Mỗi nhân vật có bốn ảnh nền trong suốt: welcome, thinking, reading, happy; tổng cộng 16 ảnh. Ba nhân vật mới được tạo theo chất liệu và tỷ lệ Mimo, mỗi tư thế là một asset riêng dưới `public/mascots/`.

`shared/personalization.js` định nghĩa danh mục. `AppearanceContext` cung cấp asset, tên hiển thị và màu theo profile. Sidebar, banner, avatar chat, bạn đồng hành và trang đăng nhập dùng chung lựa chọn. Banner tiếp tục xoay tư thế/nổi nhẹ và hỗ trợ giảm chuyển động. Trong chat, trạng thái suy nghĩ và trả lời đúng dùng tư thế tương ứng.

Năm bảng màu: leaf, sky, violet, rose, peach. Giữ màu riêng của danh mục chủ đề; màu thương hiệu, nền banner, navigation, nút, hội thoại và trang tài khoản đổi theo bảng màu. Tên Mimo trong copy/phản hồi hiển thị và TTS được thay bằng tên đã chọn ở frontend; prompt kế thừa và dữ liệu hội thoại gốc không bị sửa.

## Hồ sơ và Cloudinary

- `PATCH /api/profile` chỉ nhận displayName, nickname, companion, theme; không nhận uid, XP, role hoặc URL avatar tự do. Tên được cập nhật vào Firebase Authentication và Firestore, các trường hồ sơ ghi merge để giữ tiến bộ.
- `POST /api/profile/avatar/signature` yêu cầu tài khoản thật, ký upload cho đúng public_id theo hash uid. Secret chỉ đọc từ CLOUDINARY_URL ở backend.
- Trình duyệt tải trực tiếp lên Cloudinary, không chuyển ảnh lớn qua Vercel Function. UI nhận JPG/PNG/WebP tối đa 5 MB; chữ ký giới hạn định dạng và thu ảnh trong 512×512.
- `POST /api/profile/avatar` xác minh chữ ký phản hồi Cloudinary với public_id/version và chủ sở hữu trước khi ghi avatarUrl. Avatar phân phối ở 160×160, URL HTTPS tạo từ cấu hình máy chủ.
- Demo cho đổi tên/nhân vật/màu trong bộ nhớ phiên máy chủ; không được tải avatar. Restart backend mất lựa chọn demo.

## Cấu hình và kiểm chứng

CLOUDINARY_URL đã được đặt trong `.env` local và thêm vào `.env.example` dưới dạng trống. Chạy `node scripts/export-vercel-env.mjs` tạo lại `.env.vercel` (14 biến); import lại trên Vercel rồi Redeploy. File env không commit.

30 tests và build đạt. Test API xác minh phân quyền, cách ly profile, chống sửa XP/role, chữ ký/ownership avatar. Kiểm tra release không có Gemini/Cloudinary secret hoặc private key trong bundle frontend.

`node scripts/check-cloudinary.mjs` đã upload ảnh Mimo thử nghiệm, xác minh chữ ký, nhận ảnh từ CDN HTTP 200 và xóa đúng asset thử; không đổi avatar tài khoản thật. Browser demo đã kiểm tra nickname, lưu và reload, Miu/tím và Bông/xanh trời, thay mascot trong dashboard/chat/sidebar. Mobile 390 px không tràn ngang. Chưa đăng nhập tài khoản Firebase thật để thử file picker/avatar qua trình duyệt; luồng Cloudinary thật được kiểm tra độc lập bằng script.

Ảnh giao diện: `docs/account-personalization-preview.jpg`, `docs/bunny-theme-preview.jpg`.

Rà soát màu bổ sung: journey summary, biểu tượng/cột mốc, đường nối timeline, nhãn hiện tại, emblem cấp độ, thanh XP, trạng thái hoàn thành hằng ngày, badge số lượng trên sidebar và hover/focus sidebar dùng chung theme tokens. Đã kiểm tra màu tím thực tế: hover mục chưa được chọn có nền rgb(244,238,249), chữ rgb(115,80,166); thanh XP dùng cùng màu chính. Mobile 390 px không tràn ngang. Ảnh: `docs/journey-theme-preview.jpg`, `docs/dashboard-theme-preview.jpg`.

Các stylesheet chung đã chuyển màu thương hiệu sang `--brand-*`, có giá trị dự phòng giữ nguyên màu leaf ban đầu. Nhờ vậy khung đề bài, các bước giải, voice picker, hover bộ lọc, dải động viên ở dashboard/collection, viền và focus dùng cùng bảng màu, thay vì mỗi trang có một nhóm override. Màu riêng của nhóm chủ đề và hình huy hiệu không bị đổi. Kiểm tra browser với peach: khung đề, bước hiện tại và hai dải nhắc có nền rgb(250,236,217); hover bộ lọc không còn nền xanh. Mobile 390 px: trang rộng 380 px. Build đạt; ảnh `docs/practice-peach-theme-preview.jpg`.
