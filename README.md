# Mathate

Hệ sinh thái khám phá toán học cho trẻ 6–11 tuổi. React + Vite, Node.js + Express, Firebase Authentication/Firestore và Gemini. Dự án độc lập với `../Math-AI`.

## Chạy tại máy

Yêu cầu Node.js 22+.

```powershell
cd D:\Math-AI\Mathate
npm install
Copy-Item .env.example .env  # chỉ khi chưa có .env
# Điền GEMINI_API_KEY và Firebase Admin credentials vào .env
npm run dev
```

Frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173). API: `http://127.0.0.1:8081`.

Trong bản làm việc hiện tại `.env` đã có cấu hình do chủ dự án cung cấp và bị gitignore. `src/lib/firebase.js` đọc toàn bộ Firebase web config từ các biến `VITE_FIREBASE_*`, không có giá trị khóa viết trực tiếp trong source. `.env.example` chỉ chứa tên biến và giá trị trống cho cấu hình web.

Khi cài mới, điền các biến `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` theo Firebase Console → Project settings → Your apps. Khi deploy, đặt chúng trong môi trường **build**, rồi build lại; khởi động lại dev server khi đổi `.env`. Vite sẽ báo rõ tên biến bắt buộc còn thiếu.

`VITE_*` là cấu hình frontend và vẫn có trong bundle trình duyệt. Đây không phải nơi giữ bí mật backend: chỉ các trường web config Firebase dùng tiền tố này. `GEMINI_API_KEY`, Firebase Admin và TTS credentials vẫn chỉ ở backend, không dùng tiền tố `VITE_`. Firebase web API key dùng để định danh ứng dụng; quyền truy cập dữ liệu vẫn do Rules/IAM/Auth kiểm soát. [Vite env](https://vite.dev/guide/env-and-mode), [Firebase API keys](https://firebase.google.com/docs/projects/api-keys).

Chuyển sang env không xóa khóa khỏi các commit cũ hoặc tự đóng cảnh báo GitHub. Các thay đổi này không ghi lại lịch sử Git hay thay đổi/thu hồi khóa trên Google Cloud.

Chọn **Chơi thử** để xem toàn bộ luồng với bài mẫu, phản hồi kịch bản và XP tạm. Chế độ này không gọi Gemini và không ghi Firebase. Restart server sẽ mất dữ liệu demo. Đăng nhập tài khoản thật để dùng AI và lưu hành trình sau khi cấu hình Firebase Admin.

## Thiết lập Firebase thật

1. Firebase Console → project `mathate-8cd62` → Authentication → bật Email/Password và Google. Thêm `localhost`, `127.0.0.1` và tên miền triển khai vào Authorized domains nếu cần.
2. Tạo Firestore Database. Bật Firestore API nếu dự án yêu cầu.
3. Tạo service account **riêng của Mathate**, giữ file JSON ở vị trí riêng ngoài source. Trong `.env` đặt `GOOGLE_APPLICATION_CREDENTIALS=C:/secure/mathate-service-account.json`. Hoặc dùng `FIREBASE_SERVICE_ACCOUNT` chứa JSON qua môi trường triển khai. Hỗ trợ ADC khi chạy trên Google Cloud.
4. Triển khai rules và index bằng Firebase CLI đã đăng nhập đúng tài khoản:

```powershell
firebase deploy --only firestore --project mathate-8cd62
```

5. Tạo tài khoản admin qua trang đăng ký, sau đó chạy:

```powershell
npm run admin -- admin@example.com
```

6. Đăng xuất/đăng nhập lại, mở `/admin`, chọn **Thêm các chủ đề mẫu còn thiếu**. Không dùng client để tự ghi trường role/admin.

Web config không bao gồm quyền Firebase Admin. Nếu thiếu thông tin này, API thật sẽ báo cần cấu hình. Firebase service account cũ của Math-AI không được sao chép sang dự án mới.

## Gemini và giọng đọc

`GEMINI_API_KEY` chỉ được đọc trên backend. Model mặc định `gemini-2.5-flash`, có thể đổi qua `GEMINI_MODEL`.

```powershell
node scripts/diagnose-gemini.mjs
node scripts/check-ai.mjs
node scripts/check-ai.mjs fractions
```

`diagnose-gemini` gọi một câu ngắn để kiểm tra kết nối. `check-ai` thử tạo đề và một lượt chat bằng service gốc. Không in khóa hoặc nội dung lời giải ra log. Khi chạy trong sandbox cần quyền truy cập mạng cho tiến trình backend.

Backend phân biệt khóa không hợp lệ/bị Google chặn, thiếu quyền, sai model, quota, timeout và dịch vụ tạm lỗi bằng mã `GEMINI_*`; không trả nguyên phản hồi Google hay khóa ra client. HTTP 408/429/500/502/503/504 được thử lại một lần sau 1,5 giây. Không thử lại lỗi khóa, quyền hoặc model. Nếu đổi `.env`, khởi động lại backend để nạp cấu hình mới.

Giọng đọc dùng lại cấu hình Math-AI: nữ `vi-VN-Wavenet-A`, nam `vi-VN-Wavenet-B`, MP3, `speakingRate: 1.0`, `pitch: 0`. Chọn nam/nữ bên dưới Mimo; lựa chọn được lưu trên trình duyệt. Có cache riêng theo giọng, chia văn bản dài theo giới hạn byte và hủy lượt cũ khi dừng/đổi bài.

Phản hồi mới mặc định tự đọc và hiện chữ bằng hook `useTypewriter` sao chép nguyên văn từ Math-AI: 120 ms mỗi token (từ hoặc khoảng trắng), bắt đầu khi âm thanh phát hoặc sau 2 giây nếu còn chờ TTS. Có nút **Hiện toàn bộ**, dừng loa và **Tự đọc: bật/tắt**. Mở lại hội thoại cũ không tự đọc/chạy chữ lại; chế độ giảm chuyển động hiện toàn bộ văn bản. Trình duyệt có thể chặn autoplay; khi đó giao diện hướng dẫn nhấn loa, chữ vẫn tiếp tục hiện.

Cloud TTS dùng cấu hình riêng với Firebase Admin:

```dotenv
TTS_APPLICATION_CREDENTIALS=C:/secure/tts-service-account.json
```

Cũng hỗ trợ `TTS_SERVICE_ACCOUNT` (JSON), hoặc các biến `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` như Math-AI. Cần bật Cloud Text-to-Speech API và cấp quyền cho tài khoản. Cấu hình local hiện dùng lại tài khoản TTS Math-AI theo xác nhận của chủ dự án; khóa không được sao chép vào frontend hay source. Khi triển khai, cung cấp credential phù hợp tại môi trường hosting.

Chế độ chơi thử cũng nghe được giọng Cloud TTS nếu đã cấu hình, không phụ thuộc quyền ghi Firestore. Không dùng giọng mặc định của thiết bị khi TTS lỗi để tránh tiếng Việt bị đọc bằng accent tiếng Anh. Lỗi cấu hình/kết nối được báo rõ. Có thể kiểm tra cả hai giọng bằng `node scripts/check-tts.mjs`; MP3 thử được lưu dưới `tmp/tts-check/`.

Micro vẫn dùng SpeechRecognition, cần người dùng cấp quyền. Bạn đồng hành hiện là **avatar động từ chính ảnh Mimo** ở dashboard, có trạng thái suy nghĩ, vui, động viên và đang đọc cùng nút chào. Đây là ảnh có chuyển động CSS, chưa phải model khủng long 3D riêng. Model Spline gốc vẫn nằm trong `public/models/` nhưng không còn tải trong khung chat.

## Kiểm thử và bản production

```powershell
npm test
npm run build
$env:NODE_ENV='production'
npm start
```

Express phục vụ cả API và `dist`. Mặc định chỉ nhận kết nối từ máy hiện tại. Khi triển khai container/hosting có chủ đích, đặt `HOST=0.0.0.0` và `PORT` phù hợp; demo luôn bị tắt với `NODE_ENV=production`. API và frontend nên ở cùng origin. Nếu tách deployment, cần cấu hình origin/CORS cụ thể.

## Cấu trúc

```text
src/                  React UI, Auth, chat, giọng đọc
server/app.js         API, auth middleware, quản trị, phiên học
server/services/      Gemini, prompt adapter, Firestore, demo
server/legacy/        8 service prompt nguyên gốc, chỉnh import cho ESM
shared/catalog.js     Chủ đề mẫu, XP, level, độ khó
public/mimo.png       Mascot nền trong suốt
public/models/        Model robot Spline gốc
tests/                Kiểm thử luồng và bảo vệ dữ liệu
docs/ANALYSIS.md       Phân tích Math-AI, yêu cầu, kiến trúc và phạm vi
docs/VALIDATION.md     Kết quả kiểm chứng và giới hạn
```

`scripts/import-math-ai.mjs` ghi lại cách nhập prompt/model từ Math-AI; không cần chạy lại để sử dụng. Chỉ chạy khi chủ đích cập nhật bản kế thừa, vì nó ghi đè các bản sao dưới `server/legacy`.

Chi tiết vị trí và phạm vi điều chỉnh prompt: [docs/PROMPTS.md](docs/PROMPTS.md). Chạy `npm run verify:prompts` để so sánh 8 file với Math-AI; `npm run prompts:export` để đọc prompt thực tế trong `tmp/prompt-review` mà không gọi AI. JSON cũ được giữ nguyên, không nối thêm chỉ thị ghi đè prompt.

Điểm và cấp độ là giá trị mặc định để thử nghiệm. Chưa thực hiện triển khai Firebase, cấp admin, tạo tài khoản thật hoặc public hosting trong phiên xây dựng này.
