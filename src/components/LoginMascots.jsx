import React from "react";
import "../login-mascots.css";
const friends = [
  { id: "mimo", src: "/mimo.png" },
  { id: "bunny", src: "/mascots/bunny-leap.png" },
  { id: "cat", src: "/mascots/cat-lounging.png" },
  { id: "puppy", src: "/mascots/puppy-plane.png" },
];
const symbols = [
  { id: "sky-plus", type: "plus" },
  { id: "sky-times", type: "times" },
  { id: "sky-equals", type: "equals" },
  { id: "sky-divide", type: "divide" },
  { id: "sky-minus", type: "minus" },
  { id: "ground-plus", type: "plus" },
  { id: "ground-equals", type: "equals" },
  { id: "ground-divide", type: "divide" },
];
function MathSymbol({ type }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {type === "plus" && <path d="M24 10v28M10 24h28" />}
      {type === "minus" && <path d="M10 24h28" />}
      {type === "times" && <path d="m14 14 20 20m0-20L14 34" />}
      {type === "equals" && <path d="M11 17h26M11 31h26" />}
      {type === "divide" && (
        <>
          <path d="M11 24h26" />
          <circle cx="24" cy="10" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="24" cy="38" r="3.5" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
export default function LoginMascots() {
  return (
    <div
      className="login-mascot-group"
      role="img"
      aria-label="Mimo ló sau gò đất vẫy chào, Bông nhảy lên, Miu nằm đọc sách và Bắp chạy cùng máy bay giấy"
    >
      <div className="login-math-symbols" aria-hidden="true">
        {symbols.map((symbol) => (
          <span key={symbol.id} className={`login-math-symbol ${symbol.id}`}>
            <MathSymbol type={symbol.type} />
          </span>
        ))}
      </div>
      {friends.map((friend) => (
        <div
          key={friend.id}
          data-character={friend.id}
          className="login-mascot-friend"
        >
          <img src={friend.src} alt="" aria-hidden="true" decoding="async" />
        </div>
      ))}
    </div>
  );
}
