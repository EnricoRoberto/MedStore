import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        rollupFormat: "iife",
      },
      registerType: "autoUpdate",
      manifest: {
        name: "MedStore",
        short_name: "MedStore",
        description:
          "Inventario dei farmaci di casa: classificazione, giacenza, scadenze e notifiche.",
        theme_color: "#c96a3a",
        background_color: "#fdfaf5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
});
