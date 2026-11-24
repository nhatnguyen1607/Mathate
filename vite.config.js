import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
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
      proxy: { "/api": "http://127.0.0.1:8081" },
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
