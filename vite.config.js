import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { Agent } from "node:http";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_FIREBASE_");
  const missing = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ].filter((name) => !env[name]?.trim());
  if (missing.length)
    throw new Error(
      `Thiếu cấu hình Firebase trong môi trường: ${missing.join(", ")}. Điền các biến tương ứng trong .env hoặc cấu hình build của hosting theo .env.example.`,
    );
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: "127.0.0.1",
      watch: {
        ignored: [
          "**/.secrets/**",
          "**/*firebase-adminsdk*.json",
          "**/*service-account*.json",
        ],
      },
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem,key}",
          "**/.git/**",
          "**/.secrets/**",
          "**/*firebase-adminsdk*.json",
          "**/*service-account*.json",
        ],
      },
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8081",
          // Development backend may restart; do not reuse an idle upstream socket.
          agent: new Agent({ keepAlive: false }),
          configure(proxy) {
            proxy.on("error", (_error, _request, response) => {
              if (
                !response ||
                !("writeHead" in response) ||
                response.writableEnded
              )
                return;
              if (response.headersSent) return response.destroy();
              response.writeHead(503, {
                "Content-Type": "application/json; charset=utf-8",
              });
              response.end(
                JSON.stringify({
                  error:
                    "Backend đang khởi động lại hoặc chưa kết nối được. Giữ terminal npm run dev mở, đợi vài giây rồi thử lại.",
                  code: "BACKEND_UNAVAILABLE",
                }),
              );
            });
          },
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ["firebase/app", "firebase/auth"],
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
