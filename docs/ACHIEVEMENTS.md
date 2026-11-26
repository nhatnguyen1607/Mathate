# Huy chương và tiến độ

Danh mục `shared/achievements.js` là nguồn quy tắc chung cho server và giao diện. Có 24 huy chương trong bốn nhóm:

| Nhóm | Điều kiện |
| --- | --- |
| Giải toán | Hoàn thành 1, 5, 10, 25, 50, 100 bài |
| Chăm học | Chuỗi 3, 7, 14, 30 ngày; tổng 7, 30, 60 ngày học |
| Kinh nghiệm | Tích lũy 100, 300, 650, 1.200, 2.500 XP |
| Khám phá | Giải bài ở 3, 5, 8 chủ đề; giải 5, 15, 30 bài cùng chủ đề |

Một ngày học được ghi nhận khi hoàn thành ít nhất một bài giải với chatbot; tính theo múi giờ Asia/Bangkok (UTC+7). Làm nhiều bài trong ngày vẫn chỉ tăng một ngày học. Trắc nghiệm khởi động vẫn dùng cơ chế điểm riêng, chưa cộng vào XP và số bài giải.

Máy chủ cập nhật XP, số bài, số ngày và huy chương trong cùng giao dịch hoàn thành bài hiện có. Nộp/nhắn lại bài đã được thưởng không cộng trùng. Client không được sửa các trường tiến độ qua PATCH profile.

`bestStreak` giữ chuỗi dài nhất; `studyDayCount` giữ tổng số ngày, dù mảng `studiedDates` chỉ giữ 90 ngày gần nhất. Chuỗi hiện tại hết hạn khi bỏ qua một ngày; huy chương đã đạt vẫn được giữ. Tiến độ của huy chương chuỗi chưa đạt tính theo chuỗi hiện tại.

Hồ sơ cũ được xét bổ sung các huy chương đủ điều kiện ngay khi đọc. Dữ liệu mới được lưu khi hoàn thành bài tiếp theo. Số ngày và chuỗi cũ được phục hồi từ dữ liệu còn lưu; không đoán những ngày lịch sử đã bị xóa khỏi cửa sổ 90 ngày.

Để thêm huy chương, thêm một dòng `medal(...)` với ID duy nhất, nhóm, metric, ngưỡng, tên, mô tả, icon và màu. Có thể dùng các metric `solved`, `bestStreak`, `studyDayCount`, `xp`, `topics`, `topicBest`. Để thêm loại điều kiện mới, mở rộng `achievementMetrics` và kiểm thử trước. Icon lấy từ danh sách trong `src/pages/Collection.jsx`.

Bộ sưu tập hỗ trợ lọc nhóm, lọc đã nhận/chưa nhận, đếm tổng đã nhận và tiến độ từng huy chương. Kiểm thử quy tắc, chuyển ngày và dữ liệu cũ: `tests/achievements.test.js`.
