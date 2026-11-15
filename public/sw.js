// Service Worker de DevRootDark
// Cambia la versión cada vez que publiques para forzar la actualización de la caché.
const VERSION = 'v3';
const SHELL_CACHE = `drd-shell-${VERSION}`;
const ASSETS_CACHE = `drd-assets-${VERSION}`;
const API_CACHE = `drd-api-${VERSION}`;
// Documentos, imágenes y videos descargados para ver sin conexión.
// No lleva versión: lo que el alumno descargó se conserva aunque se actualice la app.
const MEDIA_CACHE = 'drd-media';

// Si la red no responde en este tiempo se usa lo guardado (señal muy débil)
const ESPERA_RED_MS = 8000;

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

// Rutas de la API que nunca se guardan (respuestas que cambian en cada uso o privadas)
const NO_GUARDAR = ['/api/intentos', '/api/respaldo', '/api/auth', '/api/login'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const vigentes = [SHELL_CACHE, ASSETS_CACHE, API_CACHE, MEDIA_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('drd-') && !vigentes.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red con límite de tiempo
const redConEspera = (request) =>
  new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => rechazar(new Error('timeout')), ESPERA_RED_MS);
    fetch(request).then(
      (res) => { clearTimeout(temporizador); resolver(res); },
      (err) => { clearTimeout(temporizador); rechazar(err); }
    );
  });

// Responde una parte del archivo (los videos se piden por partes: cabecera Range)
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
    statusText: 'Partial Content',
    headers: {
      'Content-Type': guardada.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${inicio}-${final}/${total}`,
      'Content-Length': String(final - inicio + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function servirMedio(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const guardada = await cache.match(request.url);
  if (guardada) return respuestaParcial(request, guardada);

  try {
    const res = await fetch(request);
    // Imágenes y PDF se guardan solos; los videos solo cuando el alumno descarga el curso
    const tipo = res.headers.get('Content-Type') || '';
    if (res.status === 200 && res.type !== 'opaque' && !tipo.startsWith('video/') && !request.headers.get('range')) {
      cache.put(request.url, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return new Response('Archivo no disponible sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // POST/PUT/DELETE siempre van a la red

  const url = new URL(request.url);

  // 1) Navegación (rutas de React Router): red primero, si falla usa index.html o la página offline
  if (request.mode === 'navigate') {
    event.respondWith(
      redConEspera(request)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put('/index.html', copia));
          }
          return res;
        })
        .catch(async () => (await caches.match('/index.html')) || caches.match('/offline.html'))
    );
    return;
  }

  // 2) Archivos subidos (videos, PDF, imágenes) de la API: primero lo descargado
  if (url.origin !== self.location.origin && url.pathname.startsWith('/api/uploads/')) {
    event.respondWith(servirMedio(request));
    return;
  }

  // 3) API: red primero y respaldo en caché (solo GET) para consultar datos sin conexión
  // Cualquier petición a /api/ de otro dominio (la URL de la API puede cambiar)
  if (url.origin !== self.location.origin && url.pathname.startsWith('/api/')) {
    const guardar = !NO_GUARDAR.some((r) => url.pathname.startsWith(r));
    event.respondWith(
      redConEspera(request)
        .then((res) => {
          if (guardar && res.status === 200) {
            const copia = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copia)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const guardada = await caches.match(request, { cacheName: API_CACHE });
          return guardada || new Response(JSON.stringify({ mensaje: 'Sin conexión', sin_conexion: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // 4) Archivos estáticos propios (JS, CSS, imágenes, fuentes): caché primero
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
