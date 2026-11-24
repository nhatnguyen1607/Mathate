export const companions = [
  {
    id: "mimo",
    name: "Mimo",
    species: "Khủng long",
    description: "Tò mò và luôn sẵn sàng khám phá.",
  },
  {
    id: "bunny",
    name: "Bông",
    species: "Thỏ",
    description: "Dịu dàng, thích những điều mới mẻ.",
  },
  {
    id: "cat",
    name: "Miu",
    species: "Mèo",
    description: "Tinh nghịch và mê tìm lời giải.",
  },
  {
    id: "puppy",
    name: "Bắp",
    species: "Cún",
    description: "Ấm áp, luôn cổ vũ bạn thử sức.",
  },
];
export const themes = [
  { id: "leaf", name: "Vườn xanh", color: "#347e52" },
  { id: "sky", name: "Trời xanh", color: "#286497" },
  { id: "violet", name: "Tím mộng mơ", color: "#7350a6" },
  { id: "rose", name: "Hồng dịu dàng", color: "#9a4266" },
  { id: "peach", name: "Cam nắng ấm", color: "#aa5625" },
];
export const poseNames = ["welcome", "thinking", "reading", "happy"];
export function companionAsset(id = "mimo", pose = "welcome") {
  if (!companions.some((c) => c.id === id)) id = "mimo";
  if (!poseNames.includes(pose)) pose = "welcome";
  return id === "mimo" && pose === "welcome"
    ? "/mimo.png"
    : `/mascots/${id}-${pose}.png`;
}
