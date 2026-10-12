// Retires the portfolio's old caching service worker.
// Browsers that still have it installed fetch this file on their next visit,
// install it, and it removes itself plus the old portfolio caches.
// Caches owned by the Map app (/map, "map-*") are left alone.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("workbox-") || n.includes("precache"))
            .filter((n) => !n.startsWith("map-"))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.registration.unregister())
  );
});
