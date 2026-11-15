// Paquetes de examen para responder sin conexión.
import axios from "axios";
import { API_URL } from "../config";
import { leer, guardar, borrar, todos } from "./almacen";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const usuarioActual = () => {
  try {
    return String(JSON.parse(localStorage.getItem("usuario"))?.id || localStorage.getItem("user_id") || "");
  } catch {
    return String(localStorage.getItem("user_id") || "");
  }
};

// Clave por alumno: si otra persona usa el mismo navegador no ve ni usa el examen ajeno
const clave = (examenId) => `${usuarioActual()}:${examenId}`;

export const leerPaquete = async (examenId) => {
  const p = await leer("paquetes", clave(examenId));
  if (!p) return null;
  if (new Date(p.expira_en).getTime() < Date.now() + (p.desfase_ms || 0) && !p.iniciado_cliente && !p.iniciado_en) {
    return { ...p, vencido: true };
  }
  return p;
};

export const borrarPaquete = (examenId) => borrar("paquetes", clave(examenId));

// Descarga el intento desde el servidor (o el mismo que ya estaba abierto) y lo guarda
export async function descargarPaquete(examenId) {
  const antes = Date.now();
  const res = await axios.post(`${API_URL}/intentos/examen/${examenId}`, {}, { headers: encabezados(), timeout: 20000 });
  const despues = Date.now();
  const paquete = res.data;
  // Diferencia entre el reloj del servidor y el del dispositivo (para contar bien el tiempo)
  const desfase_ms = new Date(paquete.hora_servidor).getTime() - (antes + despues) / 2;
  const guardado = { ...paquete, desfase_ms, descargado: Date.now() };
  await guardar("paquetes", clave(examenId), guardado);
  return guardado;
}

// Avance del examen en curso (respuestas, tiempo, eventos)
export const leerProgreso = (intentoId) => leer("progreso", intentoId);
export const guardarProgreso = (intentoId, datos) => guardar("progreso", intentoId, datos);
export const borrarProgreso = (intentoId) => borrar("progreso", intentoId);

// ¿Este examen ya se terminó y está esperando a sincronizarse?
export async function pendienteDeExamen(examenId) {
  const lista = await todos("pendientes");
  return lista.find((p) => p.tipo === "examen" && p.examen_id === examenId && p.alumno_id === usuarioActual()) || null;
}

export const resultadoGuardado = (examenId) => leer("cursos", `resultado-${examenId}`);

export { usuarioActual };
