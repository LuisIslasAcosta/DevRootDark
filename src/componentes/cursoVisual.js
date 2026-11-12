import { urlArchivo } from "../config";

// Degradados de portada para cursos sin imagen (siempre el mismo para el mismo curso)
const DEGRADADOS = [
  ["#1e3a8a", "#0ea5e9"],
  ["#4c1d95", "#db2777"],
  ["#065f46", "#14b8a6"],
  ["#7c2d12", "#f59e0b"],
  ["#312e81", "#6366f1"],
  ["#0f766e", "#84cc16"],
  ["#9d174d", "#f97316"],
  ["#1e293b", "#3b82f6"]
];

export const degradadoCurso = (texto = "") => {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  const [a, b] = DEGRADADOS[h % DEGRADADOS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

export const portadaCurso = (curso) => {
  const img = curso?.imagenes?.[0];
  if (!img) return null;
  return /^(https?:|data:)/.test(img) ? img : urlArchivo(img);
};

const PALABRAS_VACIAS = ["de", "del", "con", "y", "en", "el", "la", "los", "las", "desde", "para", "a", "al", "cero", "basico", "básico", "basica", "básica", "intermedio", "avanzado", "curso", "introduccion", "introducción"];

// "C++ desde cero" -> "C++", "IoT con Arduino" -> "IOT", "Ciencia de datos" -> "CD"
export const inicialesCurso = (nombre = "") => {
  const palabras = nombre
    .replace(/[^\p{L}\p{N}+# ]/gu, " ")
    .split(/\s+/)
    .filter((p) => p && !PALABRAS_VACIAS.includes(p.toLowerCase()));
  if (!palabras.length) return "DR";
  if (palabras[0].length <= 4) return palabras[0].toUpperCase();
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return palabras
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
};

export const colorCalificacion = (valor, aprobatoria = 70) => {
  if (valor === null || valor === undefined) return "#94a3b8";
  if (valor >= 90) return "#16a34a";
  if (valor >= aprobatoria) return "#2563eb";
  if (valor >= 50) return "#d97706";
  return "#dc2626";
};

export const formatoPrecio = (precio) => {
  const n = Number(precio) || 0;
  return n > 0 ? n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }) : "Gratis";
};
