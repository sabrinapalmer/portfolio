import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The portfolio used to ship a caching service worker (vite-plugin-pwa).
// It made returning visitors see old versions of the site, so it has been
// replaced by public/sw.js, which removes itself and the old caches.
// /map keeps its own worker at /map/sw.js.
export default defineConfig({
  plugins: [react()],
});
