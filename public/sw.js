// LiftLog service worker: makes repeat opens fast by caching the app shell
// (JS/CSS/static assets) on the phone, so the app does not re-download on
// every open.
//
// Rules — a new deploy MUST always reach the user:
// - Navigations (HTML): network-first. Fresh HTML points at new hashed
//   chunks, so the user can never be stuck on old app code.
// - /_next/static/* and /_next/image/*: cache-first. These URLs are
//   content-hashed, so a cached copy is by definition the right copy.
// - /photos/*, manifest, icons: stale-while-revalidate (serve the cached
//   copy instantly, refresh it in the background).
// - Supabase, /api/*, RSC payloads, anything cross-origin: network-only,
//   never cached — data is never served stale.
// - Caches are versioned; on activate every older liftlog-* cache is
//   deleted, so a deploy can never serve stale app code from an old cache.
//
// Bump VERSION whenever this file's caching logic changes.

const VERSION = "liftlog-v1";
const STATIC_CACHE = `liftlog-static-${VERSION}`;
const PAGE_CACHE = `liftlog-pages-${VERSION}`;
const ASSET_CACHE = `liftlog-assets-${VERSION}`;
const ALL_CACHES = [STATIC_CACHE, PAGE_CACHE, ASSET_CACHE];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("liftlog-") && !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Cross-origin (Supabase and anything else) and API routes: pass through.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Next.js RSC payloads drive client navigation data: never cache them.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (
    url.pathname.startsWith("/photos/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/icon.png" ||
    url.pathname === "/icon-192.png" ||
    url.pathname === "/apple-icon.png" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }
  // Everything else: network, uncached.
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  if (hit) return hit;
  const res = await network;
  return res || new Response(null, { status: 504 });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    const home = await cache.match("/");
    if (home) return home;
    throw new Error("offline");
  }
}
