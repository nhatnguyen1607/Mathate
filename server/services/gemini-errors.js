export function geminiHTTPError(httpStatus, body, model) {
  const error = body?.error || {};
  const providerStatus = /^[A-Z_]+$/.test(error.status || "")
    ? error.status
    : "UNKNOWN";
  const reason =
    error.details
      ?.map((value) => value.reason)
      .find((value) => typeof value === "string" && /^[A-Z_]+$/.test(value)) ||
    providerStatus;
  const rawMessage = typeof error.message === "string" ? error.message : "";
  let status = 502,
    code = "GEMINI_UPSTREAM_ERROR",
    message = "Gemini chưa trả lời được. Bạn thử lại sau một chút nhé.";
  if (/leaked|reported as leaked/i.test(rawMessage)) {
    status = 503;
    code = "GEMINI_KEY_LEAKED";
    message =
      "Google đã chặn khóa Gemini vì phát hiện khóa bị lộ. Cần thay GEMINI_API_KEY trong .env và khởi động lại backend.";
  } else if (
    reason === "API_KEY_INVALID" ||
    /API key not valid|invalid api key/i.test(rawMessage) ||
    httpStatus === 401
  ) {
    status = 503;
    code = "GEMINI_KEY_INVALID";
    message =
      "Khóa Gemini không hợp lệ hoặc đã hết hiệu lực. Kiểm tra GEMINI_API_KEY trong .env rồi khởi động lại backend.";
  } else if (httpStatus === 403) {
    status = 503;
    code = "GEMINI_PERMISSION_DENIED";
    message =
      "Khóa Gemini hiện không có quyền gọi API. Kiểm tra API restrictions, quyền truy cập và dự án Google AI Studio của khóa.";
  } else if (httpStatus === 404) {
    status = 503;
    code = "GEMINI_MODEL_NOT_FOUND";
    message =
      "Model Gemini trong GEMINI_MODEL không tồn tại hoặc khóa chưa được dùng model này. Kiểm tra cấu hình máy chủ.";
  } else if (httpStatus === 429) {
    status = 429;
    code = "GEMINI_QUOTA_EXCEEDED";
    message =
      "Gemini đã chạm giới hạn lượt gọi hoặc token. Bạn đợi một chút rồi thử lại; nếu vẫn lỗi, cần kiểm tra quota của dự án AI Studio.";
  } else if (httpStatus === 400) {
    code = "GEMINI_BAD_REQUEST";
    message =
      "Gemini từ chối yêu cầu vì cấu hình hoặc nội dung chưa hợp lệ. Kiểm tra mã lỗi Gemini trên máy chủ.";
  } else if ([408, 500, 502, 503, 504].includes(httpStatus)) {
    status = 503;
    code = "GEMINI_TEMPORARILY_UNAVAILABLE";
    message =
      "Dịch vụ Gemini đang tạm thời quá tải hoặc gián đoạn. Bạn thử gửi lại sau một chút nhé.";
  }
  // Do not attach raw response/request objects, headers, keys or user prompts.
  return Object.assign(new Error(message), {
    status,
    code,
    providerHttpStatus: httpStatus,
    providerStatus,
    providerReason: reason,
    model,
  });
}
