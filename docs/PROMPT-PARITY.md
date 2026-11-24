# Đối chiếu prompt Math-AI → Mathate

Kết quả: **8/8 service khớp toàn bộ nội dung nguồn**, ngoại trừ đường dẫn import tương đối để chạy ESM và một dòng chú thích nguồn. SHA-256 dưới đây tính trên nguyên văn file Math-AI trước khi sửa import. examContexts.js cũng khớp nguyên văn.

| File gốc | SHA-256 nguồn Math-AI | Đối chiếu |
|---|---|---|
| geminiPracticeService.js | 1c2a7cac53e56e8c94f570d00dc8d494b9c341e726e0f700d965aa2f5239a99e | Khớp |
| geminiPracticeServiceTiSo.js | 4073e6aef5899354416f0f5cdd3d2236becc3942fa9e026caa3a5df576a9f131 | Khớp |
| geminiPracticeServiceTimeVelocity.js | d5c5d29798b6286be45699bbcfa3b4a62e1f256f63502da29cbb8d1bed13a228 | Khớp |
| geminiPracticeServiceSoThapPhan.js | ad278cf5d0f4e7c14eae1b0e2baf64998817938a22be8e3d21f643902994e204 | Khớp |
| geminiChatService.js | 10fec314bc1bbdc7716eb3b5e07f4f1328d7d9d2e6948b813872c944febb71be | Khớp |
| geminiChatServiceTiSo.js | 01f0a7c183c0f7faa5d2af1daa8afe5cd93d899dfd8351835a349839989c57a7 | Khớp |
| geminiChatServiceTimeVelocity.js | edfa4f8dd4a2c29462a689b686910f973578328fa71476d81895861137c50ebe | Khớp |
| geminiChatServiceSoThapPhan.js | 53d31ab7feb8ad6e88da0aa666866aed8309329519521b7546e759b842e23edd | Khớp |

Không sửa trực tiếp 8 bản sao dưới server/legacy/gemini/. File geminiModelManager.js là adapter truyền tải mới, không phải bản sao service prompt.

Các ngoại lệ cho Mathate chỉ nằm ở server/prompts/adapt-math-ai.js và các hook trong server/services/prompts.js. Xem docs/PROMPTS.md để biết phạm vi từng ngoại lệ.

Chạy lại: npm run verify:prompts. Yêu cầu repo Math-AI ở thư mục anh em ../Math-AI; script sẽ báo lỗi nếu bất kỳ nội dung sao chép nào lệch nguồn.
