# Quản trị Mathate

Mode: Operate. Giữ bảng màu xanh lá, font Nunito và biểu tượng Lucide của Mathate. Hai mục quản trị nằm ngay dưới tiêu đề; dữ liệu tài khoản trình bày theo bảng, cuộn trong khung khi dùng điện thoại.

Sau đăng nhập email hoặc Google, Login đọc lại custom claims từ Firebase. Tài khoản có `admin: true` chuyển thẳng tới `/admin` với replace history. Người dùng thường tiếp tục tới điểm đến trước đó hoặc dashboard.

- `/admin` hoặc `/admin?tab=accounts`: danh sách Firebase Authentication, 50 tài khoản/trang, tải thêm bằng page token. Tìm chính xác email hoặc UID, sửa tên, khóa/mở khóa với hộp xác nhận.
- `/admin?tab=topics`: giữ chức năng tạo/sửa/xóa, ẩn/mở chủ đề và thêm mẫu còn thiếu.
- API tài khoản chỉ chấp nhận admin thật; demo và người dùng thường bị chặn. Không gửi password hash/custom claims nguyên bản ra client. Không hỗ trợ sửa quyền admin qua API này.
- Không khóa chính mình hoặc quản trị viên khác. Khóa người học giữ nguyên dữ liệu, thu hồi refresh tokens; API xác thực kiểm tra cả trạng thái khóa/thu hồi. Sau mở khóa, người dùng đăng nhập lại.
- Giao diện admin không phụ thuộc query index lịch sử học tập.

Kiểm chứng: 26 tests và production build đạt. Các test tài khoản kiểm tra phân trang, dữ liệu trả về, bảo vệ admin, thu hồi phiên và từ chối trường ngoài schema. Đọc danh sách Firebase thật thành công (2 tài khoản); không sửa/khóa tài khoản thật trong QA. Browser dùng fixture cục bộ cho tìm kiếm, sửa tên, khóa/mở khóa, trạng thái rỗng, chuyển tab và form chủ đề. Mobile 390 px: trang rộng 380 px, bảng cuộn bên trong. Chưa kiểm tra lại đăng nhập Google/email thật trong browser; không có mật khẩu người dùng để tự đăng nhập.

Ảnh `docs/admin-preview.jpg` dùng tài khoản minh họa cục bộ.

Tham chiếu: [Firebase quản lý tài khoản](https://firebase.google.com/docs/auth/admin/manage-users), [Firebase quản lý phiên](https://firebase.google.com/docs/auth/admin/manage-sessions).
