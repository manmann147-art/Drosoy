// service-worker.js
// Caches the app shell so it loads with no internet connection.
// Only Facebook/Firebase login (and any future online-only feature) will still need network.

const CACHE_NAME = "drosoy-cache-v1";
// Add every file your page actually loads locally (relative to the repo root).
// If everything is inlined in one HTML file, "./" and the file name are usually enough.
const FILES_TO_CACHE = [
  "./",
  "./index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Never intercept Firebase/Facebook auth network calls — let those always hit the network.
  const url = event.request.url;
  if (
    url.includes("firebaseapp.com") ||
    url.includes("googleapis.com") ||
    url.includes("facebook.com") ||
    url.includes("fbcdn.net")
  ) {
    return; // let the browser handle it normally (needs network, as expected)
  }

  // Cache-first for everything else (the app shell), so it works with no internet.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            // Save a copy for next time we're offline.
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached) // if fetch fails and nothing cached, this just fails gracefully
      );
    })
  );
});
