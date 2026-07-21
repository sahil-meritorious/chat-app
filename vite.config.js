import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/chat": {
        target: "https://rag-application-q614.onrender.com",
        changeOrigin: true,
      },
      "/chats": {
        target: "https://rag-application-q614.onrender.com",
        changeOrigin: true,
      },
      "/auth": {
        target: "https://rag-application-q614.onrender.com",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://rag-application-q614.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
