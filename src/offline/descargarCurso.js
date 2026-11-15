// Descarga un curso para verlo sin conexión: datos, documentos, imágenes, videos y exámenes.
import axios from "axios";
import { API_URL, urlArchivo } from "../config";
import { guardar, leer, pedirAlmacenamientoPersistente } from "./almacen";
import { descargarPaquete, leerPaquete, usuarioActual } from "./examenOffline";

export const CACHE_MEDIOS = "drd-media";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const claveCurso = (cursoId) => `curso-${usuarioActual()}:${cursoId}`;
export const leerCursoDescargado = (cursoId) => leer("cursos", claveCurso(cursoId));

// Las peticiones GET a la API pasan por el service worker, que guarda la respuesta en su caché
const obtener = (ruta, conToken = false) =>
  axios.get(`${API_URL}${ruta}`, conToken ? { headers: encabezados() } : undefined).then((r) => r.data);

async function guardarArchivo(cache, url) {
  if (await cache.match(url)) return;
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok || res.status === 206) throw new Error(`No se pudo descargar ${url}`);
  await cache.put(url, res);
}

/**
 * Descarga todo el curso. `alAvanzar({ hechos, total, texto })` informa el progreso.
 * Devuelve un resumen con lo que no se pudo descargar.
 */
export async function descargarCurso(cursoId, { conVideos = true, alAvanzar = () => {} } = {}) {
  await pedirAlmacenamientoPersistente();

  // 1) Datos del curso (mismas rutas que usa la vista del curso)
  alAvanzar({ hechos: 0, total: 1, texto: "Descargando datos del curso..." });
  const [curso, niveles, inscripciones] = await Promise.all([
    obtener(`/cursos/${cursoId}`),
    obtener(`/niveles/curso/${cursoId}/con_lecciones`),
    obtener(`/inscripciones/mis-inscripciones`, true),
    obtener(`/progreso/alumno/curso/${cursoId}`, true).catch(() => null),
    obtener(`/progreso/alumno`, true).catch(() => null),
    obtener(`/cursos`, true).catch(() => null),
  ]);

  const inscripcion = (inscripciones || []).find((i) => i.curso_id === cursoId);
  if (!inscripcion || inscripcion.estado !== "aceptada") {
    throw new Error("Solo puedes descargar cursos con inscripción aceptada.");
  }

  const examenes = new Map();
  const archivos = new Set();
  for (const nivel of niveles || []) {
    for (const leccion of nivel.lecciones || []) {
      (leccion.archivos || []).forEach((a) => archivos.add(urlArchivo(a)));
      const delaLeccion = await obtener(`/examenes/leccion/${leccion.id}`).catch(() => []);
      delaLeccion.forEach((e) => examenes.set(e.id, e));
    }
    const delNivel = await obtener(`/examenes/nivel/${nivel.id}`).catch(() => []);
    delNivel.forEach((e) => examenes.set(e.id, e));
  }
  (curso.imagenes || []).forEach((img) => !/^data:/.test(img) && archivos.add(/^https?:/.test(img) ? img : urlArchivo(img)));
  (curso.videos || []).forEach((v) => archivos.add(urlArchivo(v)));
  if (curso.imagen && !/^data:/.test(curso.imagen)) archivos.add(/^https?:/.test(curso.imagen) ? curso.imagen : urlArchivo(curso.imagen));

  const esVideo = (u) => /\.(mp4|webm)(\?|$)/i.test(u);
  const lista = [...archivos].filter((u) => conVideos || !esVideo(u));
  const total = lista.length + examenes.size;
  let hechos = 0;
  const fallos = [];

  // 2) Documentos, imágenes y videos
  const cache = await caches.open(CACHE_MEDIOS);
  for (const url of lista) {
    alAvanzar({ hechos, total, texto: `Descargando ${decodeURIComponent(url.split("/").pop())}` });
    try {
      await guardarArchivo(cache, url);
    } catch {
      fallos.push(url.split("/").pop());
    }
    hechos += 1;
  }

  // 3) Exámenes: se descarga un intento por examen (preguntas sin respuestas)
  let examenesListos = 0;
  for (const examen of examenes.values()) {
    alAvanzar({ hechos, total, texto: `Preparando examen: ${examen.titulo}` });
    try {
      const actual = await leerPaquete(examen.id);
      if (!actual || actual.vencido) await descargarPaquete(examen.id);
      examenesListos += 1;
    } catch (err) {
      // 409 = ya usó sus intentos o no tiene preguntas: no es un error de descarga
      if (err.response?.status !== 409) fallos.push(examen.titulo);
    }
    hechos += 1;
  }

  const resumen = {
    curso_id: cursoId,
    nombre: curso.nombre,
    estado: inscripcion.estado,
    inscripcion,
    fecha: Date.now(),
    archivos: lista.length - fallos.filter((f) => lista.some((u) => u.endsWith(f))).length,
    examenes: examenesListos,
    conVideos,
    fallos,
  };
  await guardar("cursos", claveCurso(cursoId), resumen);
  alAvanzar({ hechos: total, total, texto: "Listo" });
  return resumen;
}

// Espacio usado y disponible (aprox.)
export async function espacioUsado() {
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usado: usage || 0, total: quota || 0 };
  } catch {
    return null;
  }
}
