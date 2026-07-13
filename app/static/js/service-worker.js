const CACHE_NAME = "2ez-v1";
const STATIC_ASSETS = [
  "/",
  "/static/css/main.css",
  "/static/js/take.js",
  "/static/js/vocab_quiz.js",
  "/static/js/flashcard.js",
  "/static/js/theme.js",
  "/static/js/greeting.js",
  "/static/js/markdown-render.js",
  "/static/js/form-validation.js",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
];

// O'rnatish
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Faollashtirish — eski cache tozalash
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache first, network fallback
self.addEventListener("fetch", (event) => {
  // POST requestlarni cache qilmaymiz
  if (event.request.method !== "GET") return;

  // Chrome extension va boshqa requestlarni o'tkazib yuborish
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Faqat muvaffaqiyatli responslarni cache qilish
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaque"
          ) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Offline holatda
          return caches.match("/");
        });
    })
  );
});