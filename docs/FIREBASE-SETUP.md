# Firebase Admin local

Đã cấu hình credential của project `mathate-8cd62` trong `.env` qua `GOOGLE_APPLICATION_CREDENTIALS`. File service account do chủ dự án cung cấp đã được chuyển từ thư mục gốc vào `.secrets/`. Thư mục này và các file `*firebase-adminsdk*.json` bị loại khỏi Git, khỏi Vite watch và khỏi HTTP serving của Vite. Không in hoặc sao chép private key vào source.

Đã kiểm tra:

- Firebase Authentication: truy cập thành công; có người dùng đã đăng ký.
- Firestore `(default)`: truy cập thành công.
- Đã khởi tạo các chủ đề mẫu còn thiếu; không ghi đè các chủ đề đã có.
- Backend `/api/health` nhận `persistenceReady: true`; TTS vẫn giữ cấu hình riêng.
- HTTP tới file trong `.secrets` bị từ chối với 403.

## Còn thiếu index lịch sử

Google Cloud trả `PERMISSION_DENIED` khi service account thử tạo composite index. Không tự thay đổi IAM để mở rộng quyền tài khoản.

Chủ dự án mở Firestore Database → Indexes → Composite → Create index:

| Thuộc tính | Giá trị |
|---|---|
| Collection ID | `sessions` |
| Field | `uid` — Ascending |
| Field | `createdAt` — Descending |
| Query scope | Collection |

Cấu hình đã có ở `firestore.indexes.json`. Đợi trạng thái index là Enabled rồi chạy `node scripts/check-firebase.mjs` để kiểm tra lại. Trong thời gian thiếu index, API lấy lịch sử có thể báo lỗi và dashboard chưa tải đầy đủ.

## Tài khoản quản trị giao diện

Kết nối Admin SDK không tự biến người dùng thành admin của website. Chưa tự gán quyền admin cho tài khoản nào. Khi chủ dự án chọn email đã đăng ký, dùng:

```powershell
npm run admin -- email-da-dang-ky@example.com
```

Sau đó đăng xuất và đăng nhập lại để lấy token có custom claim mới.
