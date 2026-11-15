// Service Worker del reproductor. El mismo archivo está en /reproductor/ y /reproductor-admin/:
// cada copia solo controla su carpeta y usa sus propias cachés.
const VERSION = 'r2';
const BASE = new URL(self.registration.scope).pathname; // "/reproductor/" o "/reproductor-admin/"
const PREFIJO = `sonora|${BASE}|`; // "sonora|/reproductor/|" o "sonora|/reproductor-admin/|"
const SHELL_CACHE = `${PREFIJO}shell-${VERSION}`;
const ASSETS_CACHE = `${PREFIJO}assets-${VERSION}`;
const API_CACHE = `${PREFIJO}api-${VERSION}`;
// Misma caché que usa la app de cursos: un video descargado allá también se ve aquí
const MEDIA_CACHE = 'drd-media';
const ESPERA_RED_MS = 8000;

const SHELL_FILES = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  '/reproductor/icons/icon-192.png',
  '/reproductor/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => (k.startsWith(PREFIJO) || k.startsWith('sonora-shell') || k.startsWith('sonora-assets') || k.startsWith('sonora-api')) && ![SHELL_CACHE, ASSETS_CACHE, API_CACHE].includes(k))
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const redConEspera = (request) =>
  new Promise((resolver, rechazar) => {
    const t = setTimeout(() => rechazar(new Error('timeout')), ESPERA_RED_MS);
    fetch(request).then((r) => { clearTimeout(t); resolver(r); }, (e) => { clearTimeout(t); rechazar(e); });
  });

async function respuestaParcial(request, guardada) {
  const rango = request.headers.get('range');
  if (!rango) return guardada;
  const datos = await guardada.arrayBuffer();
  const total = datos.byteLength;
  const [, ini, fin] = /bytes=(\d*)-(\d*)/.exec(rango) || [];
  let inicio = ini ? Number(ini) : 0;
  let final = fin ? Number(fin) : total - 1;
  if (!ini && fin) { inicio = Math.max(0, total - Number(fin)); final = total - 1; }
  if (inicio >= total || inicio > final) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  }
  final = Math.min(final, total - 1);
  return new Response(datos.slice(inicio, final + 1), {
    status: 206,
    headers: {
      'Content-Type': guardada.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${inicio}-${final}/${total}`,
      'Content-Length': String(final - inicio + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      redConEspera(request)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(`${BASE}index.html`, copia));
          }
          return res;
        })
        .catch(() => caches.match(`${BASE}index.html`, { cacheName: SHELL_CACHE }))
    );
    return;
  }

  // Videos de los cursos: primero lo descargado
  if (url.origin !== self.location.origin && url.pathname.startsWith('/api/uploads/')) {
    event.respondWith((async () => {
      const guardada = await (await caches.open(MEDIA_CACHE)).match(request.url);
      if (guardada) return respuestaParcial(request, guardada);
      return fetch(request);
    })());
    return;
  }

  // Lista de cursos y videos: red primero, si no hay, lo último que se vio
  if (url.origin !== self.location.origin && url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/respaldo') || url.pathname.startsWith('/api/login')) return;
    event.respondWith(
      redConEspera(request)
        .then((res) => {
          if (res.status === 200) {
            const copia = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copia)).catch(() => {});
          }
          return res;
        })
        .catch(async () => (await caches.match(request, { cacheName: API_CACHE }))
          || new Response(JSON.stringify({ sin_conexion: true }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(ASSETS_CACHE).then((c) => c.put(request, copia));
        }
        return res;
      }))
    );
  }
});
