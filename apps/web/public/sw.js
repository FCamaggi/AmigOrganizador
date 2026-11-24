// Service worker: shows a friendly offline page when a navigation fails.
// Groups and profiles are live data and are never cached. Only the offline
// page and the static files it needs to look right (its CSS, fonts, logo and
// cloth textures) are kept, and they are served only when the network fails.
const CACHE = "knot-offline-v2";
const OFFLINE_URL = "/sin-conexion";

/** Same-origin static files referenced by the offline page or its CSS. */
const STATIC_REF =
  /(?:href|src)="(\/(?:_next\/static|brand|yarn)\/[^"?#]+)"|url\((?:"|')?(\/(?:_next\/static|brand|yarn)\/[^)"'?#]+)/g;

function staticRefs(text) {
  const refs = new Set();
  for (const match of text.matchAll(STATIC_REF)) {
    const path = match[1] ?? match[2];
    if (path && !path.endsWith(".js")) refs.add(path);
  }
  return [...refs];
}

async function cacheOfflinePage() {
  const cache = await caches.open(CACHE);
  const page = await fetch(new Request(OFFLINE_URL, { cache: "reload" }));
  if (!page.ok) throw new Error(`offline page: ${page.status}`);
  await cache.put(OFFLINE_URL, page.clone());
  const html = await page.text();
  const first = staticRefs(html);
  const css = first.filter((path) => path.endsWith(".css"));
  const nested = await Promise.all(
    css.map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) return [];
      await cache.put(path, response.clone());
      return staticRefs(await response.text());
    }),
  );
  const rest = [...new Set([...first, ...nested.flat()])].filter(
    (path) => !css.includes(path),
  );
  // Best effort: a missing texture must not block the offline page itself.
  await Promise.allSettled(rest.map((path) => cache.add(path)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheOfflinePage().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL, { cacheName: CACHE });
        return cached ?? Response.error();
      }),
    );
    return;
  }
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!/^\/(?:_next\/static|brand|yarn)\//.test(url.pathname)) return;
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(url.pathname, { cacheName: CACHE });
      return cached ?? Response.error();
    }),
  );
});
