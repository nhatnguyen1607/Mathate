import React from "react";
import "../login-mascots.css";
const friends = [
  { id: "mimo", src: "/mimo.png" },
  { id: "bunny", src: "/mascots/bunny-leap.png" },
  { id: "cat", src: "/mascots/cat-lounging.png" },
  { id: "puppy", src: "/mascots/puppy-plane.png" },
];
export default function LoginMascots() {
  return (
    <div
      className="login-mascot-group"
      role="img"
      aria-label="Mimo ló sau gò đất vẫy chào, Bông nhảy lên, Miu nằm đọc sách và Bắp chạy cùng máy bay giấy"
    >
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
