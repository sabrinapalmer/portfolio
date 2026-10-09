import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Activate a new service worker as soon as it installs. With the default
      // ("prompt"), an outdated worker keeps answering every page, including
      // /networth, until all tabs of the site are closed.
      registerType: "autoUpdate",
      manifest: {
        name: "Sabrina Palmer Portfolio",
        short_name: "SP Portfolio",
        theme_color: "#1DB954",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // /networth and /map are separate static pages; keep the service
        // worker from answering them with the portfolio shell or precaching them.
        globIgnores: ["networth/**", "map/**"],
        navigateFallbackDenylist: [/^\/networth/, /^\/map/],
      },
    }),
  ],
});
