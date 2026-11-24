// A deliberately separate, visibly labelled offline experience. Never presented as AI.
export function demoProblem(topic, difficulty) {
  const n = difficulty === "easy" ? 4 : difficulty === "medium" ? 12 : 24;
  const problems = {
    numbers: {
      problem: `Mimo có ${n} hạt giống. Bạn Thỏ tặng Mimo thêm ${n / 2} hạt giống. Hỏi Mimo có tất cả bao nhiêu hạt giống?`,
      answer: `${n * 1.5} hạt giống`,
      solution: `${n} + ${n / 2} = ${n * 1.5} hạt giống.`,
      numbers: [n, n / 2],
      value: n * 1.5,
      operator: "add",
    },
    geometry: {
      problem: `Khu vườn hình chữ nhật của Mimo dài ${n} m, rộng ${n / 2} m. Hỏi chu vi khu vườn là bao nhiêu mét?`,
      answer: `${n * 3} m`,
      solution: `(${n} + ${n / 2}) × 2 = ${n * 3} m.`,
      numbers: [n, n / 2],
      value: n * 3,
      operator: "perimeter",
    },
    fractions: {
      problem:
        "Mimo có 1,5 lít nước cam. Bạn Thỏ mang thêm 0,5 lít nước cam. Hỏi hai bạn có tất cả bao nhiêu lít nước cam?",
      answer: "2 lít",
      solution: "1,5 + 0,5 = 2 lít.",
      numbers: [1.5, 0.5],
      value: 2,
      operator: "add",
    },
    measurement: {
      problem: `Dải ruy băng xanh dài ${n} cm. Dải ruy băng vàng dài ${n / 2} cm. Hỏi hai dải ruy băng dài tất cả bao nhiêu xăng-ti-mét?`,
      answer: `${n * 1.5} cm`,
      solution: `${n} + ${n / 2} = ${n * 1.5} cm.`,
      numbers: [n, n / 2],
      value: n * 1.5,
      operator: "add",
    },
    ratio: {
      problem: `Mimo có ${n * 2} quả dâu. Mimo tặng bạn Thỏ một nửa số dâu. Hỏi bạn Thỏ được tặng bao nhiêu quả dâu?`,
      answer: `${n} quả dâu`,
      solution: `${n * 2} : 2 = ${n} quả dâu.`,
      numbers: [n * 2, 2],
      value: n,
      operator: "divide",
    },
    movement: {
      problem: `Mimo đi bộ lúc 8 giờ và đến khu vườn lúc ${difficulty === "easy" ? 9 : 10} giờ cùng buổi sáng. Hỏi Mimo đã đi trong bao nhiêu giờ?`,
      answer: `${difficulty === "easy" ? 1 : 2} giờ`,
      solution: `${difficulty === "easy" ? 9 : 10} - 8 = ${difficulty === "easy" ? 1 : 2} giờ.`,
      numbers: [8, difficulty === "easy" ? 9 : 10],
      value: difficulty === "easy" ? 1 : 2,
      operator: "subtract",
    },
  };
  return {
    title: "Một ngày vui cùng Mimo",
    ...(problems[topic.id] || problems.numbers),
  };
}
export function demoReply(s, message, hint) {
  const normalized = message.toLowerCase().replace(/,/g, ".");
  const values = (normalized.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const prompts = [
    "Bạn tìm được những số nào trong đề bài?",
    "Bạn sẽ làm thế nào để tìm điều đề bài hỏi?",
    "Bạn thử viết phép tính kèm kết quả nhé?",
    "Bạn dùng phép tính ngược để kiểm tra kết quả nhé?",
  ];
  if (hint || /không (biết|hiểu)|giúp|gợi ý/.test(normalized))
    return {
      message: `Mình cùng nghĩ từng chút nhé. ${prompts[s.step - 1]}`,
      correct: false,
      advance: false,
      complete: false,
    };
  const containsResult = values.includes(s.demoData.value);
  const method =
    s.demoData.operator === "perimeter"
      ? /chu vi|cộng|nhân|\+|×|\*/.test(normalized)
      : s.demoData.operator === "divide"
        ? /chia|nửa|:|\/|÷/.test(normalized)
        : s.demoData.operator === "subtract"
          ? /trừ|hiệu|-/.test(normalized)
          : /cộng|tổng|thêm|gộp|\+/.test(normalized);
  const correct =
    s.step === 1
      ? s.demoData.numbers.every((n) => values.includes(n))
      : s.step === 2
        ? method
        : s.step === 3
          ? containsResult && /[=]|bằng|kết quả|đáp số/.test(normalized)
          : containsResult &&
            /kiểm tra|thử lại|vì|trừ|chia|cộng|nhân|[+\-×÷*/=]/.test(
              normalized,
            );
  return {
    message: correct
      ? s.step === 4
        ? "Bạn đã tự giải và kiểm tra bài toán rồi! Mimo rất vui được học cùng bạn."
        : `Bạn làm tốt lắm! ${prompts[s.step]}`
      : `Mình cùng xem lại một chút nhé. ${prompts[s.step - 1]}`,
    correct,
    advance: correct,
    complete: correct && s.step === 4,
  };
}
