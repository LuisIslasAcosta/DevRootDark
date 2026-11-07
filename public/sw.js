// Service Worker de DevRootDark
// Cambia la versión cada vez que publiques para forzar la actualización de la caché.
const VERSION = 'v1';
const SHELL_CACHE = `drd-shell-${VERSION}`;
const ASSETS_CACHE = `drd-assets-${VERSION}`;
const API_CACHE = `drd-api-${VERSION}`;
const API_ORIGIN = 'https://apidevrootdark.onrender.com';

// Archivos base de la aplicación (app shell)
const SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/logo-banner.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const vigentes = [SHELL_CACHE, ASSETS_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !vigentes.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // POST/PUT/DELETE siempre van a la red

  const url = new URL(request.url);

  // 1) Navegación (rutas de React Router): red primero, si falla usa index.html o la página offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copia = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/index.html', copia));
          return res;
        })
        .catch(async () => (await caches.match('/index.html')) || caches.match('/offline.html'))
    );
    return;
  }

  // 2) API: red primero y respaldo en caché (solo GET) para consultar datos sin conexión
  if (url.origin === API_ORIGIN) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copia));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3) Archivos estáticos propios (JS, CSS, imágenes, fuentes): caché primero
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(ASSETS_CACHE).then((c) => c.put(request, copia));
          }
          return res;
        })
      )
    );
  }
});

// Permite que la app pida activar una nueva versión de inmediato
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
