# Lớp học và tài khoản giáo viên

## Sử dụng

1. Người dùng đăng ký bằng email hoặc Google như hiện tại. Tài khoản mới mặc định là học sinh.
2. Admin vào **Tài khoản → Sửa tài khoản**, chọn **Giáo viên**, nhấn **Lưu thay đổi**. Không thể đổi vai trò admin hoặc tự đổi quyền qua hồ sơ cá nhân. Tài khoản vừa được cấp quyền tải lại trang hoặc đăng nhập lại; đăng nhập giáo viên chuyển đến `/teacher`.
3. Giáo viên tạo lớp, đặt tên và gửi mã tham gia gồm **5 chữ số**. Học sinh vào **Lớp của mình → Tham gia lớp**, điền mã và họ tên đầy đủ. Mỗi tài khoản chỉ có một thành viên trong cùng lớp.

   Trang giáo viên tổng hợp số lớp, lượt học sinh, chủ đề và bản nháp từ dữ liệu thật; hiển thị các việc cần chuẩn bị và hạn khởi động sắp tới. Trong mỗi lớp có hướng dẫn mời học sinh, nút sao chép lời mời và gợi ý chủ đề khi lớp còn mới. Số 0 được giữ đúng khi chưa có học sinh/bài làm; không chèn thành tích minh họa vào dữ liệu thật.
4. Giáo viên mở lớp, chọn **Thêm chủ đề**, chọn chủ đề và hạn khởi động nếu cần. AI tạo **bản nháp 8 câu**, mỗi câu 4 phương án và một đáp án đúng. Thầy cô xem/chỉnh sửa đề, đáp án và giải thích trong tab **Đề và đáp án**, rồi nhấn **Giao khởi động**. Sau khi giao, câu hỏi và đáp án được khóa.
5. Học sinh vào lớp sẽ thấy **Khởi động** và **Vận dụng** trong từng chủ đề. Vận dụng ban đầu khóa; giáo viên dùng nút **Mở vận dụng** để mở cho cả lớp, hoặc khóa lại. API kiểm tra quyền này cả lúc tạo bài và lúc tiếp tục chat, không chỉ ẩn nút ở giao diện. Phần tự học bên ngoài lớp vẫn được giữ.
6. Học sinh chủ động nhấn **Bắt đầu khởi động**. Đồng hồ bắt đầu từ máy chủ, tối đa **7 phút**, kết thúc sớm hơn nếu đến hạn giao bài. Lượt làm và đáp án được tự lưu; tải lại trang không làm mới thời gian. Nộp xong hoặc hết hạn không thể làm lại, kể cả mở tab khác.
7. Giáo viên xem tab **Kết quả khởi động**, làm mới thủ công hoặc chờ cập nhật mỗi 15 giây khi tab đang mở. Khi đủ học sinh nộp, nhấn **Tạo đề luyện tập** để chốt nhóm theo kết quả hiện tại. Nếu có thêm bài nộp sau đó, dùng **Chia lại nhóm**; bộ phiếu cũ vẫn được giữ trong dữ liệu, giao diện chuyển sang bộ mới.
8. Mỗi nhóm có **2 bài tự luận**, chỉ giáo viên của lớp thấy. Có thể tải PDF từng nhóm hoặc PDF toàn bộ khi tạo đủ. Mỗi phiếu có tên lớp, chủ đề, số nhóm, đầy đủ họ tên thành viên và chỗ trình bày cách giải. Đề không in điểm hoặc thứ hạng học sinh.

## Quy tắc điểm và nhóm tạm thời

- Điểm = số câu đúng / 8 × 10, giữ tối đa 2 chữ số thập phân. Một câu đúng được **1,25 điểm**; sai/bỏ trống được 0, không phạt và không thưởng theo tốc độ.
- 8 câu gồm 2 câu cho mỗi kỹ năng: hiểu đề, lập kế hoạch, tính toán, kiểm tra. Kết quả từng kỹ năng được dùng để bổ sung định hướng tạo bài cho nhóm.
- Xếp từ điểm cao xuống thấp trong **cùng lớp và cùng chủ đề**. Bằng điểm thì dùng thứ tự tham gia lớp, cuối cùng dùng UID để kết quả ổn định; không dùng thời gian làm bài.
- Chia liên tiếp mỗi **5 em**. Nhóm cuối giữ số còn lại, có thể 1–4 em. Chỉ đưa học sinh **đã nộp hoặc đã hết giờ được chốt kết quả** vào nhóm; học sinh chưa làm không bị tự gán điểm 0 để xếp nhóm.
- Trung bình nhóm **≥8** tạo mức khó; **≥5 và <8** mức vừa; **<5** mức dễ. Mỗi nhóm nhận đúng 2 bài theo mức đó. Phiếu đang tạo được lưu theo nhóm, lỗi có thể tiếp tục mà không mất nhóm đã hoàn tất.
- Vận dụng cá nhân trong lớp tự chọn mức theo kết quả của em đó với cùng ngưỡng; chưa có kết quả thì mức dễ. Điểm khởi động hiện tách khỏi XP tự học để có thể thay quy tắc sau.
- Quy tắc điểm/nhóm tập trung ở `shared/classrooms.js`. Prompt trắc nghiệm mới ở `server/services/warmup-ai.js`; lấy cảm hứng các kỹ năng trong phiếu học tập Math-AI. Hai bài theo nhóm gọi `createAIProblem`, dùng nguyên các service practice và lớp điều chỉnh prompt Mathate đã có; tám file legacy practice/chat không bị sửa.

## Dữ liệu và triển khai

Vai trò giáo viên lưu bằng Firebase Auth custom claim `role: "teacher"`; quyền admin cũ tiếp tục dùng `admin: true`. Backend lớp học đọc lại quyền hiện hành từ Firebase Admin để việc thu hồi quyền có hiệu lực cả với ID token cũ. Client cập nhật claims khi đăng nhập, tải lại hoặc quay về tab.

Firestore qua Firebase Admin SDK:

| Đường dẫn | Mục đích |
| --- | --- |
| `classrooms/{classId}` | Lớp và giáo viên sở hữu |
| `classCodes/{fiveDigits}` | Mã lớp duy nhất, cấp mã bằng transaction |
| `classrooms/{classId}/members/{uid}` | Họ tên và ngày tham gia |
| `classMemberships/{uid}/classes/{classId}` | Danh sách lớp của học sinh |
| `classrooms/{classId}/activities/{topicId}` | Chủ đề, đề/đáp án riêng, hạn và công tắc vận dụng |
| `…/activities/{topicId}/attempts/{uid}` | Lượt duy nhất, giờ bắt đầu/kết thúc, đáp án đã lưu và điểm |
| `…/activities/{topicId}/plans/{planId}` | Phiên chốt danh sách nhóm |
| `…/plans/{planId}/groups/{groupId}` | Thành viên, mức độ và hai bài của nhóm |

Không mở Firestore cho trình duyệt. Rules chặn truy cập trực tiếp hiện tại được giữ. Các truy vấn mới dùng collection con hoặc một điều kiện bằng nên không cần thêm composite index. Bắt đầu, lưu và chấm bài dùng transaction; đáp án đúng không được trả cho học sinh. Nếu học sinh đóng trình duyệt/mất mạng khi hết giờ, lần API tiếp theo của học sinh hoặc khi giáo viên xem lớp sẽ chốt bài từ **đáp án đã lưu trước hạn**. Không cần tiến trình cron và không chấp nhận đáp án mới gửi sau hạn. Rút ngắn deadline cũng rút ngắn các lượt đang làm; kéo dài không tạo lại lượt đã hoàn thành.

Không cần biến môi trường mới. Tái sử dụng Firebase Admin, Gemini, TTS và các cấu hình hiện tại. Chạy `npm install` sau khi lấy code để cài PDFKit. Vercel đã cấu hình kèm `server/assets/**` cho font PDF; build/redeploy cả frontend lẫn API. Font Nunito được nhúng vào PDF và có giấy phép OFL kèm theo.

## Kiểm tra

`npm test` bao gồm kiểm thử API/phân quyền, trùng mã, cạnh tranh bắt đầu bài, thứ tự lưu đáp án, chốt quá hạn, giữ lượt làm, khóa vận dụng ở API chat, tính điểm, chia nhóm, tiếp tục tạo phiếu và xuất PDF. `npm run build` kiểm tra frontend. Giao diện được thử với dữ liệu minh họa riêng trên localhost, không tạo lớp hoặc đổi quyền trong Firebase thật. PDF minh họa được render và kiểm tra dấu tiếng Việt/họ tên.

Nội dung trắc nghiệm do AI tạo cần giáo viên duyệt trước khi giao. Không tự đánh giá độ đúng của một câu hỏi chỉ bằng schema JSON; giao diện bản nháp hỗ trợ chỉnh đáp án và giải thích.
