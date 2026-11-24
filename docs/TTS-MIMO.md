# Khôi phục giọng Việt và đồng bộ Mimo

## Nguyên nhân accent tiếng Anh

Phiên bản trước bỏ qua Cloud TTS khi chơi thử hoặc thiếu Firebase Admin, rồi dùng Web Speech. Khi chưa có giọng `vi-VN` trên máy, code vẫn tạo utterance không gán voice; trình duyệt có thể dùng giọng mặc định tiếng Anh. Backend cũng cố định giọng nữ và chưa nhận lựa chọn nam/nữ.

## Thay đổi

- `server/services/tts.js`: dùng đúng hai giọng WaveNet và audioConfig của Math-AI: A/FEMALE, B/MALE, vi-VN, MP3, tốc độ 1.0, pitch 0.
- Tách TTS credentials khỏi Firebase Admin. Hỗ trợ định dạng credential/env của Math-AI và cấu hình TTS riêng. Sau khi chủ dự án xác nhận, local `.env` chỉ trỏ tới file service account cũ cho TTS; không sao chép nội dung khóa.
- `/api/tts` vẫn xác thực/rate limit, nhưng không chặn demo và không đòi quyền ghi Firestore. Kiểm tra `voiceGender` và giới hạn byte UTF-8.
- `src/lib/tts-player.js`: phát MP3 như Math-AI, cache theo văn bản + giới tính, dừng/hủy yêu cầu cũ, chia đoạn dài. Không còn fallback sang giọng trình duyệt.
- `src/pages/Practice.jsx`: chọn nam/nữ và lưu lựa chọn, phân biệt đang tải/đang đọc, khóa chọn giọng khi đang đọc, dừng bằng nút loa.
- `src/components/RobotCompanion.jsx` và `src/companion.css`: dùng chính asset `public/mimo.png`; cử động theo trạng thái và khi chào. Gỡ Spline khỏi UI chat; không sửa prompt toán học. Avatar này là ảnh động bằng CSS, không phải model 3D mới.

## Kiểm tra

- 15 kiểm thử đạt, gồm giữ đúng voice/config gốc, không fallback tiếng Anh, chống lượt đọc cũ phát muộn, cache nam/nữ và giới hạn byte tiếng Việt.
- `node scripts/check-tts.mjs` đã gọi Cloud TTS thành công: nữ A trả 33792 byte MP3; nam B trả 33408 byte MP3, cho cùng câu chào tiếng Việt. File nghe thử: `tmp/tts-check/female.mp3` và `male.mp3`.
- Build frontend thành công; không còn tải runtime/model Spline trong bundle chat.
- Kết quả kiểm tra trình duyệt bổ sung trong `docs/VALIDATION.md`.

## Tham chiếu

- [Danh sách giọng Google Cloud TTS](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
- [Xác thực Cloud TTS](https://docs.cloud.google.com/text-to-speech/docs/authentication)
- Đối chiếu mã cũ: `../Math-AI/src/services/ttsService.js`, `../Math-AI/api/tts.js` và endpoint `/api/tts` trong `../Math-AI/src/server/index.js`.
