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
        // Bundle come script classico: la registrazione manuale (per passare
        // la config Firebase via querystring, vedi lib/notifications.ts) non
        // deve preoccuparsi di { type: "module" }.
        rollupFormat: "iife",
      },
      // Registrazione manuale (lib/serviceWorker.ts), non lo script iniettato
      // dal plugin, così possiamo passare la config Firebase via querystring
      // e ottenere la ServiceWorkerRegistration per getToken() di FCM.
      injectRegister: false,
      registerType: "autoUpdate",
      manifest: {
        name: "MedStore",
        short_name: "MedStore",
        description:
          "Inventario dei farmaci di casa: classificazione, giacenza, scadenze e notifiche.",
        theme_color: "#0f766e",
        background_color: "#f8fafc",
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
