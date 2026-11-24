export const difficulties = {
  easy: {
    label: "Dễ",
    description: "Làm quen nhẹ nhàng",
    xp: 20,
    steps: "1 bước tính · số nhỏ",
  },
  medium: {
    label: "Vừa",
    description: "Thử tài một chút",
    xp: 35,
    steps: "1–2 bước tính · suy luận",
  },
  hard: {
    label: "Khó",
    description: "Sẵn sàng chinh phục",
    xp: 50,
    steps: "2–3 bước tính · thử thách",
  },
};
export const seedTopics = [
  {
    id: "numbers",
    name: "Số & phép tính",
    description: "Kết bạn với những con số, cộng trừ thật vui!",
    category: "numbers",
    icon: "calculator",
    color: "green",
    promptType: "general",
    promptGuidance:
      "Số tự nhiên, cộng, trừ, nhân, chia. Dễ: cộng trừ trong 20. Vừa: nhân chia trong 100. Khó: 2–3 phép tính trong 1000.",
    active: true,
  },
  {
    id: "geometry",
    name: "Thế giới hình học",
    description: "Tìm những hình khối thú vị ở quanh mình.",
    category: "geometry",
    icon: "shapes",
    color: "purple",
    promptType: "general",
    promptGuidance:
      "Nhận dạng hình, chu vi và diện tích hình vuông, hình chữ nhật. Dễ: đếm cạnh. Vừa: tính chu vi. Khó: diện tích với 2–3 bước. Không dùng định lý THCS.",
    active: true,
  },
  {
    id: "fractions",
    name: "Phân số & thập phân",
    description: "Chia chiếc bánh, khám phá từng phần nhỏ.",
    category: "numbers",
    icon: "pie",
    color: "orange",
    promptType: "decimal",
    promptGuidance:
      "Dễ: phân số trực quan với cùng mẫu số 2, 4, 8. Vừa: cộng trừ thập phân 1 chữ số. Khó: nhân chia số thập phân hữu hạn. Dùng dấu phẩy thập phân.",
    active: true,
  },
  {
    id: "measurement",
    name: "Đo lường quanh em",
    description: "Dài bao nhiêu? Nặng thế nào? Cùng đo nhé!",
    category: "life",
    icon: "ruler",
    color: "blue",
    promptType: "general",
    promptGuidance:
      "Độ dài cm, m, khối lượng g, kg, thể tích lít. Đơn vị rõ ràng. Dễ cùng đơn vị, vừa đổi đơn vị, khó suy luận 2 bước.",
    active: true,
  },
  {
    id: "ratio",
    name: "Tỉ số & phần trăm",
    description: "Khám phá những tỉ lệ đầy bất ngờ.",
    category: "numbers",
    icon: "percent",
    color: "pink",
    promptType: "ratio",
    promptGuidance:
      "Dễ: chia đều và so sánh số lượng. Vừa: tìm 10%, 25%, 50% của số. Khó: tỉ số phần trăm trong mua sắm, tất cả dữ kiện phải phục vụ câu hỏi cuối.",
    active: true,
  },
  {
    id: "movement",
    name: "Thời gian & chuyển động",
    description: "Cùng Mimo tính giờ cho những chuyến đi.",
    category: "life",
    icon: "rocket",
    color: "yellow",
    promptType: "velocity",
    promptGuidance:
      "Dễ: đọc giờ, tính thời gian nguyên giờ. Vừa: vận tốc với cùng đơn vị. Khó: quãng đường, vận tốc, thời gian 2 bước. Số liệu thực tế, không vận tốc phi lý.",
    active: true,
  },
];
export const steps = [
  "Hiểu bài toán",
  "Lập kế hoạch",
  "Cùng giải nào",
  "Kiểm tra lại",
];
export const levels = [
  { min: 0, name: "Mầm non toán học" },
  { min: 100, name: "Nhà khám phá nhỏ" },
  { min: 300, name: "Ngôi sao tư duy" },
  { min: 650, name: "Nhà phiêu lưu toán học" },
  { min: 1200, name: "Bậc thầy toán học" },
];
export function getLevel(xp = 0) {
  const index = Math.max(
    0,
    levels.findLastIndex((level) => xp >= level.min),
  );
  const level = levels[index],
    next = levels[index + 1];
  return {
    ...level,
    number: index + 1,
    next: next?.min ?? null,
    progress: next
      ? Math.min(100, ((xp - level.min) / (next.min - level.min)) * 100)
      : 100,
  };
}
export function awardedXP(difficulty, hints = 0) {
  return Math.max(10, difficulties[difficulty].xp - Math.min(3, hints) * 3);
}
