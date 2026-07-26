import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PWA manifest + service worker (FCM-aware) are wired in during the M9 milestone.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
