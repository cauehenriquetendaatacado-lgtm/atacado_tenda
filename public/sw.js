const CACHE = "tenda-atacado-v16";
const ASSETS = ["/", "/index.html", "/logo.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls (always fresh data), cache-first for static assets.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // A verificação de servidor online precisa ir sempre direto à rede (sem cache).
  if (url.pathname === "/api/ping") return;

  // Só trata GET. Envios (POST/PUT/PATCH/DELETE) vão direto à rede: se falharem, o
  // painel guarda o registro na fila do aparelho e reenvia quando o servidor voltar.
  if (event.request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r || Response.error())
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
