# Deploy Mathate lên Vercel

Frontend Vite và backend Express dùng chung một project/domain. `api/index.js` export Express app; `vercel.json` chuyển `/api/*` tới function và các đường dẫn SPA tới `index.html`. Giữ Application Preset Vite, Root Directory `./` nếu thư mục GitHub chứa package.json tại gốc, Build Command `npm run build`, Output Directory `dist`, Install Command `npm ci`. Không dùng `npm run dev` hoặc `npm start` làm build command.

Commit và push các thay đổi local lên GitHub trước khi deploy. `.env`, `.secrets` và các service-account JSON không đưa lên Git; `.vercelignore` cũng loại khỏi upload.

## Environment Variables

Đặt Production; thêm Preview nếu muốn bản preview hoạt động, chỉ với những branch bạn tin cậy. Copy các trường Firebase web từ `.env` local:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Backend:

| Tên | Giá trị |
|---|---|
| GEMINI_API_KEY | Khóa đang dùng trong .env local |
| GEMINI_MODEL | gemini-2.5-flash |
| FIREBASE_PROJECT_ID | mathate-8cd62 |
| FIREBASE_SERVICE_ACCOUNT | Toàn bộ nội dung JSON service account Mathate |
| TTS_SERVICE_ACCOUNT | Toàn bộ nội dung JSON service account TTS Math-AI đã được cho phép dùng lại |
| DEMO_MODE | false |
| CLOUDINARY_URL | URL Cloudinary riêng của backend; có sẵn trong file .env.vercel mới |

Hai biến JSON: mở đúng file JSON local, copy từ dấu `{` đầu đến dấu `}` cuối và dán làm Value; không bọc thêm dấu nháy, không dán đường dẫn file, giữ nguyên các chuỗi `\n` trong private_key. Không đặt tiền tố VITE_ cho các biến backend. Không thêm GOOGLE_APPLICATION_CREDENTIALS hoặc TTS_APPLICATION_CREDENTIALS trỏ tới ổ C:/D:; các file đó không tồn tại trên Vercel. Không cần PORT/HOST. Giữ authDomain Firebase hiện tại, không thay bằng domain Vercel.

Node.js: chọn 24.x trong Project Settings nếu cần khớp môi trường local. Bật Fluid Compute; function đã đặt maxDuration 120 giây cho các lượt Gemini chậm. Với tài khoản TTS cũ, dự án Cloud đó vẫn phải bật Cloud Text-to-Speech API và có quota/billing phù hợp.

## Sau Deploy

1. Copy hostname production Vercel thực tế. Firebase Console → Authentication → Settings → Authorized domains → Add domain. Nhập hostname, không `https://`, không port, không đường dẫn; thêm custom domain nếu có.
2. Mở `/api/health`: cần `ok: true`, `persistenceReady: true`, `aiConfigured: true`, `ttsConfigured: true`, `demoEnabled: false`. Những cờ cấu hình này chưa kiểm chứng quyền và kết nối Google thực tế.
3. Thử đăng nhập, refresh trực tiếp `/admin`, xem tài khoản/chủ đề, tạo bài AI, gửi câu trả lời và nghe TTS.
4. `/api` lỗi 500: xem Vercel Logs ở function api/index.js; kiểm tra JSON env và quyền Google. `auth/unauthorized-domain`: kiểm tra hostname Firebase. Thiếu VITE_* lúc build: đặt env rồi Redeploy. Lỗi query lịch sử: xem `docs/FIREBASE-SETUP.md` để tạo composite index.

Thay env sau deployment phải Redeploy; VITE_* cần có từ lúc build. Dữ liệu thật dùng Firestore. Bộ đếm rate limit và khóa chống gửi đồng thời hiện nằm trong bộ nhớ mỗi instance; chưa có phối hợp giữa nhiều instance.

Đã chạy 26 tests, build, kiểm tra production và entry Vercel ở local. Chưa thực hiện Vercel deployment/build trên hạ tầng Vercel trong phiên này.

Nguồn: [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [cấu hình functions](https://vercel.com/docs/functions/configuring-functions/duration), [Firebase Google Sign-in](https://firebase.google.com/docs/auth/web/google-signin).
