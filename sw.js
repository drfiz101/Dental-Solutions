// Keeps the app opening even with weak or no internet.
const CACHE = "ds-v2";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/logo.jpg", "./icons/logo-full.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase handles its own data; only cache the app's files, fonts and libraries
  if (url.hostname.includes("firestore.googleapis.com") || url.hostname.includes("identitytoolkit") || url.hostname.includes("securetoken")) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes("gstatic.com") || url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("cdnjs.cloudflare.com") || url.hostname.includes("cdn.jsdelivr.net"))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
