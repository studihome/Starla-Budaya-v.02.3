// STARLA BUDAYA Hybrid PWA Service Worker
// Supports standalone offline playback AND safe embed/iframe operation without breaking Storyline media streaming or 360° embeds.

const SW_VERSION = 'starla-budaya-pwa-v2';
const SHELL_CACHE = `${SW_VERSION}-shell`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const MEDIA_CACHE = `${SW_VERSION}-media`;

const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/starla-icon.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/apple-touch-icon.png',
  '/html5/lib/scripts/starla-content-bridge.js',
  '/html5/lib/scripts/bootstrapper.min.js',
  '/html5/lib/scripts/frame.desktop.min.js',
  '/html5/lib/scripts/slides.min.js',
  '/html5/data/js/paths.js',
  '/html5/data/js/data.js',
  '/html5/data/js/frame.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(
        CORE_PRECACHE_URLS.map(async (url) => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (res && res.ok) {
              await cache.put(url, res);
            }
          } catch (_err) {
            // Skip optional asset failures so install always succeeds cleanly
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const validCaches = new Set([SHELL_CACHE, RUNTIME_CACHE, MEDIA_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !validCaches.has(k))
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isMediaAssetPath(pathname) {
  return (
    pathname.startsWith('/mobile/') ||
    pathname.startsWith('/story_content/') ||
    pathname.startsWith('/icons/') ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|mp3|wav|ogg|woff2?|ttf)$/i.test(pathname)
  );
}

function isAppCodePath(pathname) {
  return (
    pathname.startsWith('/html5/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    /\.(?:js|mjs|css|json)$/i.test(pathname)
  );
}

function createOfflineEmptyResponse(status = 503) {
  return new Response('', {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Never intercept non-GET requests or HTTP Range requests (critical for MP4 video streaming 206)
  if (request.method !== 'GET' || request.headers.has('range')) {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch (_err) {
    return;
  }

  // 2. Never intercept cross-origin embeds (360° Budaya, 360° Pameran, Supabase, external CDNs)
  if (!isSameOrigin(url)) {
    return;
  }

  // 3. Never intercept server API routes, SW script, or MP4 streaming videos
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sw.js' ||
    /\.mp4$/i.test(url.pathname)
  ) {
    return;
  }

  // 4. HTML Navigation: Network-First with Offline App-Shell Fallback
  if (
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/story.html'
  ) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            const rootCopy =
              url.pathname === '/' || url.pathname === '/index.html'
                ? networkRes.clone()
                : null;
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(request, copy).catch(() => {});
              if (rootCopy) {
                cache.put('/', rootCopy).catch(() => {});
              }
            });
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          return new Response('Offline — STARLA BUDAYA', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 5. Bridge Bundle & Manifest: Network-First with Offline Fallback (prevents stale bundle errors on updates)
  if (
    url.pathname.endsWith('starla-content-bridge.js') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached || createOfflineEmptyResponse(503);
        })
    );
    return;
  }

  // 6. Static Images, Audio & Icons: Cache-First with Network Fill
  if (isMediaAssetPath(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const copy = networkRes.clone();
              caches
                .open(MEDIA_CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => {});
            }
            return networkRes;
          })
          .catch(() => createOfflineEmptyResponse(404));
      })
    );
    return;
  }

  // 7. Storyline Scripts, Slide JS Chunks & Stylesheets: Stale-While-Revalidate with safe Response fallback
  if (isAppCodePath(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkPromise = fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const copy = networkRes.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => {});
            }
            return networkRes;
          })
          .catch(() => cached || createOfflineEmptyResponse(503));

        return cached || networkPromise;
      })
    );
  }
});
