const CACHE_NAME = "ngangela-plus-v3";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./icon.svg",
  "./favicon.svg",
  "./manifest.json",
  "./dictionary.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});