# Phiên đăng nhập JWT

Mathate dùng JWT do Firebase Authentication cấp cho đăng nhập Google và email/mật khẩu. Backend xác thực bằng Firebase Admin; không tạo thêm hệ tài khoản hoặc JWT riêng.

- **Access token:** Firebase ID token dạng JWT, hạn khoảng một giờ; gửi trong `Authorization: Bearer ...` khi gọi API.
- **Refresh token:** Firebase SDK lưu cùng phiên và dùng để lấy access token mới. `src/lib/firebase.js` cấu hình lưu bền vững bằng IndexedDB, dự phòng local storage rồi session storage nếu trình duyệt không hỗ trợ.
- API chờ khôi phục phiên trước khi gửi yêu cầu, tránh lỗi 401 lúc vừa tải lại trang.
- Khi nhận 401, `src/lib/api-client.js` lấy token mới và gửi lại đúng một lần. Các yêu cầu hết hạn cùng lúc dùng chung lần gia hạn; giữ nguyên body và request ID. Không tự gửi lại khi mất mạng, 403 hoặc 5xx.
- Refresh token hết hiệu lực hoặc token mới vẫn bị từ chối sẽ kết thúc phiên và yêu cầu đăng nhập lại. Mất mạng khi gia hạn giữ lại phiên để thử lại sau.
- `onIdTokenChanged` cập nhật vai trò khi token đổi. Đổi tài khoản/đăng xuất chặn phản hồi cũ cập nhật dữ liệu tài khoản mới.
- Đăng xuất gọi `signOut` để xóa phiên SDK. Refresh token không gửi đến API Mathate và không có bản sao token riêng do ứng dụng tự ghi vào local storage.
- Backend luôn kiểm tra token bị thu hồi bằng `verifyIdToken(token, true)`. API riêng tư trả `Cache-Control: no-store`. Các quyền admin, giáo viên và học sinh tiếp tục do máy chủ quyết định.

Không cần thêm `JWT_SECRET` hay biến môi trường mới. Cấu hình Firebase hiện có vẫn được sử dụng. Lưu phiên phụ thuộc quyền lưu dữ liệu của trình duyệt; nếu trình duyệt chặn mọi cơ chế lưu trữ, SDK chỉ giữ phiên trong bộ nhớ.

Kiểm thử tự động nằm trong `tests/api-client.test.js` và `tests/auth-api.test.js`, dùng phiên giả lập; không tạo tài khoản Firebase thật. Kiểm tra thực tế bằng tài khoản của bạn: đăng nhập, tải lại trang, đóng/mở lại trình duyệt, đổi vai trò rồi quay lại tab, và đăng xuất.

Tài liệu Firebase: [Quản lý phiên và vòng đời token](https://firebase.google.com/docs/auth/admin/manage-sessions), [lưu trạng thái đăng nhập](https://firebase.google.com/docs/auth/web/auth-state-persistence).
