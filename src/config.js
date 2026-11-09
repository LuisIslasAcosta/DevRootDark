// URL de la API: se configura con la variable VITE_API_URL
// (en Netlify: Site configuration → Environment variables; en local: archivo .env)
const limpiar = (url) => (url || "").trim().replace(/\/+$/, "");

export const API_URL = limpiar(import.meta.env.VITE_API_URL) || "http://localhost:5000/api";

// Dominio del servidor sin "/api" (para imágenes y archivos)
export const API_ORIGIN = API_URL.replace(/\/api$/, "");

// Ruta pública de un archivo subido según su extensión
export const rutaArchivo = (archivo = "") => {
  const ext = archivo.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return `/api/uploads/imagenes/${archivo}`;
  if (["mp4", "webm"].includes(ext)) return `/api/uploads/videos/${archivo}`;
  if (["pdf"].includes(ext)) return `/api/uploads/pdfs/${archivo}`;
  return `/api/uploads/${archivo}`;
};

export const urlArchivo = (archivo) => `${API_ORIGIN}${rutaArchivo(archivo)}`;
