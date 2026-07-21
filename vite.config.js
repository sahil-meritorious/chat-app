import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/chat": {
        target: "http://127.0.0.1:7000",
        changeOrigin: true,
      },
      "/chats": {
        target: "http://127.0.0.1:7000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://127.0.0.1:7000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:7000",
        changeOrigin: true,
      },
    },
  },
});
