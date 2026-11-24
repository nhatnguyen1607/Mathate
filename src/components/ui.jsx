import React from "react";
import {
  Calculator,
  Shapes,
  PieChart,
  Ruler,
  Percent,
  Rocket,
  LoaderCircle,
  AlertCircle,
  Sprout,
} from "lucide-react";
const icons = {
  calculator: Calculator,
  shapes: Shapes,
  pie: PieChart,
  ruler: Ruler,
  percent: Percent,
  rocket: Rocket,
};
export function TopicIcon({ name, size = 28, ...props }) {
  const Icon = icons[name] || Calculator;
  return <Icon size={size} strokeWidth={1.8} {...props} />;
}
export function Spinner({ text = "Mimo đang chuẩn bị…" }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={28} />
      <span>{text}</span>
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={20} />
      <span>{message}</span>
      {retry && <button onClick={retry}>Thử lại</button>}
    </div>
  );
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Sprout size={36} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Mascot({ className = "", ...props }) {
  return (
    <img
      src="/mimo.png"
      alt="Mimo, khủng long xanh nhỏ đang vẫy tay"
      className={`mascot ${className}`}
      {...props}
    />
  );
}
