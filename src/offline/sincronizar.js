// Estado de conexión y envío de lo que quedó pendiente (exámenes y lecciones vistas).
import { useSyncExternalStore } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { borrar, guardar, todos } from "./almacen";

// ================= ESTADO GLOBAL =================
// fase: "en_linea" | "sin_conexion" | "sincronizando" | "sincronizado" | "error"
let estado = {
  fase: typeof navigator !== "undefined" && !navigator.onLine ? "sin_conexion" : "en_linea",
  pendientes: 0,
  mensaje: "",
};
const oyentes = new Set();

function cambiar(parcial) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((o) => o());
}

const suscribir = (o) => {
  oyentes.add(o);
  return () => oyentes.delete(o);
};

export const useEstadoConexion = () => useSyncExternalStore(suscribir, () => estado);
export const estaEnLinea = () => navigator.onLine && estado.fase !== "sin_conexion";

// Avisos para que las vistas se refresquen cuando algo se sincroniza
const avisos = new Set();
export const alSincronizar = (fn) => {
  avisos.add(fn);
  return () => avisos.delete(fn);
};

// ================= COLA =================
export async function agregarPendiente(id, pendiente) {
  await guardar("pendientes", id, { ...pendiente, id, creado: Date.now() });
  await contarPendientes();
}

export async function contarPendientes() {
  try {
    const lista = await todos("pendientes");
    cambiar({ pendientes: lista.length });
    return lista;
  } catch {
    return [];
  }
}

const encabezados = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function enviarUno(p) {
  if (p.tipo === "examen") {
    // El envío vale con la clave del intento, aunque la sesión haya caducado sin conexión
    const res = await axios.post(
      `${API_URL}/intentos/${p.intento_id}/enviar`,
      { ...p.cuerpo, reloj_cliente: Date.now() },
      { headers: encabezados(), timeout: 20000 }
    );
    return res.data;
  }
  if (p.tipo === "leccion_vista") {
    await axios.post(`${API_URL}/analisis/progreso/leccion/vista`, p.cuerpo, { headers: encabezados(), timeout: 20000 });
    return true;
  }
  return true;
}

let enCurso = null;

export function sincronizar() {
  if (enCurso) return enCurso;
  enCurso = (async () => {
    const lista = (await contarPendientes()).filter((p) => !p.rechazado);
    if (!navigator.onLine) {
      cambiar({ fase: "sin_conexion" });
      return;
    }
    if (!lista.length) {
      cambiar({ fase: "en_linea", mensaje: "" });
      return;
    }

    cambiar({ fase: "sincronizando", mensaje: "" });
    let fallidos = 0;
    let sinSesion = false;
    const resultados = [];

    for (const p of lista.sort((a, b) => a.creado - b.creado)) {
      try {
        const r = await enviarUno(p);
        await borrar("pendientes", p.id);
        if (p.tipo === "examen") {
          resultados.push({ ...p, resultado: r });
          await guardar("cursos", `resultado-${p.examen_id}`, { ...r, titulo: p.titulo, examen_id: p.examen_id });
        }
      } catch (err) {
        const codigo = err.response?.status;
        if (!err.response) {
          // Se volvió a caer la red: se reintenta después
          fallidos += 1;
          break;
        }
        if (codigo === 401) sinSesion = true;
        if ([403, 404, 409].includes(codigo) && p.tipo === "examen") {
          // El servidor lo rechazó definitivamente: se guarda el motivo para mostrarlo
          await guardar("pendientes", p.id, { ...p, rechazado: err.response?.data?.mensaje || "Rechazado por el servidor" });
        }
        fallidos += 1;
      }
    }

    await contarPendientes();
    if (fallidos) {
      cambiar({
        fase: navigator.onLine ? "error" : "sin_conexion",
        mensaje: sinSesion ? "Inicia sesión de nuevo para terminar de sincronizar." : "Algunos envíos no se pudieron completar; se reintentará.",
      });
    } else {
      cambiar({ fase: "sincronizado", mensaje: resultados.length ? `${resultados.length} ${resultados.length === 1 ? "examen enviado" : "exámenes enviados"}` : "" });
      setTimeout(() => estado.fase === "sincronizado" && cambiar({ fase: "en_linea", mensaje: "" }), 3500);
    }
    avisos.forEach((fn) => fn(resultados));
  })().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

// ================= ARRANQUE =================
let iniciado = false;

export function iniciarSincronizacion() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;

  window.addEventListener("offline", () => cambiar({ fase: "sin_conexion" }));
  window.addEventListener("online", () => {
    // Pequeña espera: al reconectar la red tarda un momento en responder
    setTimeout(sincronizar, 1500);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && navigator.onLine) sincronizar();
  });
  setInterval(() => navigator.onLine && estado.pendientes > 0 && sincronizar(), 30000);
  sincronizar();
}
