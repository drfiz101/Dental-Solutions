// Dental Solutions works offline: the app and its libraries are kept on the device.
// Clinic data is saved on the device by Firebase and uploads when the internet is back.
const CACHE = "ds-v137";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/logo.jpg", "./icons/logo-full.jpg"];
const LIBS = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];
const CDN = h => h.includes("gstatic.com") || h.includes("fonts.googleapis.com") || h.includes("cdnjs.cloudflare.com") || h.includes("cdn.jsdelivr.net");

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() =>
    Promise.all(LIBS.map(u => c.add(new Request(u, { mode: "cors" })).catch(() => {})))
  )).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase syncs its own data
  if (url.hostname.includes("firestore.googleapis.com") || url.hostname.includes("identitytoolkit") || url.hostname.includes("securetoken") || url.hostname.includes("api.anthropic.com")) return;
  const mine = url.origin === location.origin, lib = CDN(url.hostname);
  // the version check must always see the real file on the internet
  if (mine && /sw\.js$/.test(url.pathname)) return;
  if (!mine && !lib) return;
  // Versioned libraries never change: use a good saved copy straight away, otherwise download it
  if (lib) {
    e.respondWith(caches.match(req).then(hit => {
      if (hit && hit.ok) return hit;
      const get = req.mode === "no-cors" ? fetch(new Request(req.url, { mode: "cors", credentials: "omit" })).catch(() => fetch(req)) : fetch(req);
      return get.then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || Response.error());
    }));
    return;
  }
  // App files: open instantly from the saved copy, and fetch the newest version in the background for next time
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match("./index.html").then(r => r || Response.error()));
  })));
});
