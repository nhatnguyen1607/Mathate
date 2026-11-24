import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
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
});
