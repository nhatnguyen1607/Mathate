# Bộ tư thế Mimo trong banner

Giữ nguyên ảnh gốc `public/mimo.png` (vẫy chào); ba ảnh mới tạo từ chính ảnh tham chiếu đó, nền trong suốt, cùng màu xanh, khăn vàng, ba lô và chất liệu:

- `public/mascots/mimo-thinking.png`: tò mò, suy nghĩ.
- `public/mascots/mimo-reading.png`: ngồi đọc sách.
- `public/mascots/mimo-happy.png`: vui mừng chiến thắng.

`src/components/HeroMimo.jsx` luân phiên bốn tư thế mỗi 8 giây. Chỉ đưa ảnh đã tải vào vòng xoay; ảnh lỗi được bỏ qua. Hai lớp ảnh chuyển opacity trong 650 ms; khung cố định tránh thay đổi bố cục.

`src/hero-mimo.css` cho Mimo nổi nhẹ theo nhịp 4,8 giây (11 px desktop, 7 px mobile); bóng co và nhạt khi Mimo lên cao. Chỉ banner dashboard dùng bộ ảnh này; avatar chatbot giữ hành vi riêng.

Có nút tạm dừng/tiếp tục bằng chuột hoặc bàn phím. Dừng timer và chuyển động khi banner ra khỏi viewport, tab bị ẩn hoặc người dùng bật `prefers-reduced-motion`. Không phát âm thanh, không đọc thay đổi ảnh qua screen reader vì đây là minh họa trang trí.

Kiểm tra browser thật: bốn ảnh tải thành công; tự đổi sang thinking, reading và happy; dừng/tiếp tục hoạt động. Mobile 390 px: chiều rộng trang 380 px, không tràn ngang. Ảnh bàn giao: `docs/mimo-gallery-preview.jpg`.
