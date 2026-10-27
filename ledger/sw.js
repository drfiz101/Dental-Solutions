// The ledger moved to /ExecutiveClinic/. Clear this old copy so the new address loads.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("ledger-")).map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.navigate("https://drfiz101.github.io/ExecutiveClinic/"))));
});
