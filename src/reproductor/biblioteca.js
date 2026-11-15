// Biblioteca del reproductor: música/videos del dispositivo y videos de los cursos aceptados.
import { API_ORIGIN, API_URL, urlArchivo } from "../config";

const EXT_AUDIO = ["mp3", "m4a", "aac", "ogg", "oga", "opus", "wav", "flac", "weba"];
const EXT_VIDEO = ["mp4", "webm", "m4v", "ogv", "mov"];

const extension = (nombre = "") => nombre.split(".").pop().toLowerCase();
export const tipoDe = (nombre) => (EXT_VIDEO.includes(extension(nombre)) ? "video" : EXT_AUDIO.includes(extension(nombre)) ? "audio" : null);
const limpiarNombre = (nombre = "") => decodeURIComponent(nombre.replace(/^.*[\\/]/, "")).replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");

// ================= CARPETA GUARDADA (IndexedDB) =================
const DB = "sonora";

function abrir() {
  return new Promise((resolver, rechazar) => {
    const p = indexedDB.open(DB, 1);
    p.onupgradeneeded = () => p.result.createObjectStore("ajustes");
    p.onsuccess = () => resolver(p.result);
    p.onerror = () => rechazar(p.error);
  });
}

async function ajuste(clave, valor) {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction("ajustes", valor === undefined ? "readonly" : "readwrite");
    const s = tx.objectStore("ajustes");
    const p = valor === undefined ? s.get(clave) : s.put(valor, clave);
    tx.oncomplete = () => resolver(p.result);
    tx.onerror = () => rechazar(tx.error);
  });
}

export const soportaCarpetas = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

async function leerCarpeta(dir, ruta = "", lista = []) {
  for await (const entrada of dir.values()) {
    if (entrada.kind === "directory") {
      await leerCarpeta(entrada, `${ruta}${entrada.name}/`, lista);
    } else if (tipoDe(entrada.name)) {
      lista.push({ id: `local:${ruta}${entrada.name}`, titulo: limpiarNombre(entrada.name), grupo: ruta.replace(/\/$/, "") || dir.name, tipo: tipoDe(entrada.name), origen: "local", manejador: entrada });
    }
  }
  return lista;
}

// Elegir carpeta (Chrome/Edge en computadora). Se recuerda para la próxima vez.
export async function elegirCarpeta() {
  const dir = await window.showDirectoryPicker({ id: "sonora-musica", mode: "read" });
  await ajuste("carpeta", dir);
  return leerCarpeta(dir);
}

// La carpeta guardada necesita permiso otra vez después de cerrar el navegador (un clic)
export async function carpetaGuardada() {
  try {
    const dir = await ajuste("carpeta");
    if (!dir) return null;
    const permiso = await dir.queryPermission({ mode: "read" });
    return { dir, nombre: dir.name, permiso };
  } catch {
    return null;
  }
}

export async function reconectarCarpeta(dir) {
  const permiso = await dir.requestPermission({ mode: "read" });
  if (permiso !== "granted") throw new Error("Sin permiso para leer la carpeta");
  return leerCarpeta(dir);
}

// Respaldo para celulares y navegadores sin selector de carpetas
export const desdeArchivos = (archivos) =>
  [...archivos]
    .filter((f) => tipoDe(f.name))
    .map((f) => ({
      id: `local:${f.webkitRelativePath || f.name}`,
      titulo: limpiarNombre(f.name),
      grupo: (f.webkitRelativePath || "").split("/").slice(0, -1).join("/") || "Mis archivos",
      tipo: tipoDe(f.name),
      origen: "local",
      archivo: f,
    }));

export async function urlLocal(pista) {
  const archivo = pista.archivo || (await pista.manejador.getFile());
  return URL.createObjectURL(archivo);
}

// ================= VIDEOS DE LOS CURSOS =================
const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
export const haySesion = () => !!localStorage.getItem("token");

async function pedir(ruta, conToken = false) {
  const res = await fetch(`${API_URL}${ruta}`, conToken ? { headers: encabezados() } : undefined);
  if (res.status === 401 || res.status === 422) throw Object.assign(new Error("sesion"), { sesion: true });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function videosDeCursos() {
  const inscripciones = await pedir("/inscripciones/mis-inscripciones", true);
  const aceptadas = (inscripciones || []).filter((i) => (i.estado || "aceptada") === "aceptada");
  const pistas = [];

  for (const ins of aceptadas) {
    const [curso, niveles] = await Promise.all([
      pedir(`/cursos/${ins.curso_id}`).catch(() => ({ nombre: ins.curso_nombre })),
      pedir(`/niveles/curso/${ins.curso_id}/con_lecciones`).catch(() => []),
    ]);
    const nombreCurso = curso?.nombre || ins.curso_nombre || "Curso";
    (curso?.videos || []).forEach((v, i) =>
      pistas.push({ id: `curso:${v}`, titulo: `Video ${i + 1}`, grupo: nombreCurso, tipo: "video", origen: "curso", url: urlArchivo(v) }));
    for (const nivel of niveles || []) {
      for (const leccion of nivel.lecciones || []) {
        (leccion.archivos || []).filter((a) => tipoDe(a) === "video").forEach((a) =>
          pistas.push({ id: `curso:${a}`, titulo: leccion.titulo || limpiarNombre(a), grupo: `${nombreCurso} · ${nivel.titulo}`, tipo: "video", origen: "curso", url: urlArchivo(a) }));
      }
    }
  }
  return pistas;
}

// ¿Está guardado para verse sin conexión? (misma caché que la app de cursos)
export async function estaDescargado(url) {
  try {
    return !!(await (await caches.open("drd-media")).match(url));
  } catch {
    return false;
  }
}

export async function descargarVideo(url) {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok || res.status === 206) throw new Error("No se pudo descargar");
  await (await caches.open("drd-media")).put(url, res);
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* opcional */
  }
}

export async function borrarDescarga(url) {
  await (await caches.open("drd-media")).delete(url);
}

// ================= MÚSICA PREDETERMINADA (la que sube el administrador) =================
export async function musicaDevRoot() {
  const res = await fetch(`${API_URL}/musica`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // [{ id, titulo, audio, video }]
}

// Convierte la lista en pistas: con video si se pidió y existe; si no, solo audio
export const pistasDevRoot = (canciones, conVideo) =>
  (canciones || [])
    .map((c) => {
      const ruta = conVideo ? c.video || c.audio : c.audio || c.video;
      if (!ruta) return null;
      return {
        id: `devroot:${ruta}`,
        titulo: c.titulo,
        grupo: conVideo ? "DevRootMusic · videos" : "DevRootMusic",
        tipo: tipoDe(ruta),
        origen: "devroot",
        url: `${API_ORIGIN}/api/uploads/${ruta}`,
      };
    })
    .filter(Boolean);
