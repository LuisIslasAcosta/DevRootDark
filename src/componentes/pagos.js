import axios from "axios";
import { API_URL } from "../config";

// ================= ESTADOS DE INSCRIPCIÓN =================
export const ESTADOS_INSCRIPCION = {
  pendiente_pago: { texto: "Pendiente de pago", clase: "pendiente", ayuda: "Realiza tu pago y sube tu comprobante." },
  en_revision: { texto: "Pago en revisión", clase: "revision", ayuda: "Tu profesor está validando el pago." },
  aceptada: { texto: "Inscripción aceptada", clase: "aceptada", ayuda: "Ya tienes acceso al curso." },
  rechazada: { texto: "Pago rechazado", clase: "rechazada", ayuda: "Revisa el motivo y sube un nuevo comprobante." },
};

export const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const formatoMoneda = (monto) =>
  Number(monto || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

// ================= LLAMADAS A LA API =================
export const inscribirseCurso = (cursoId) =>
  axios.post(`${API_URL}/inscripciones`, { curso_id: cursoId }, { headers: authHeader() });

export const obtenerMisInscripciones = () =>
  axios.get(`${API_URL}/inscripciones/mis-inscripciones`, { headers: authHeader() });

export const subirComprobante = (inscripcionId, datos) => {
  const form = new FormData();
  Object.entries(datos).forEach(([k, v]) => v !== undefined && v !== null && form.append(k, v));
  return axios.post(`${API_URL}/inscripciones/${inscripcionId}/comprobante`, form, { headers: authHeader() });
};

export const obtenerPagosProfesor = (estado) =>
  axios.get(`${API_URL}/inscripciones/profesor/pagos`, {
    headers: authHeader(),
    params: estado ? { estado } : {},
  });

export const validarPago = (inscripcionId, accion, motivo = "") =>
  axios.put(`${API_URL}/inscripciones/${inscripcionId}/validar`, { accion, motivo }, { headers: authHeader() });

// Abre el comprobante en una pestaña nueva (se descarga con el token porque es privado)
export const abrirComprobante = async (inscripcionId) => {
  const ventana = window.open("", "_blank");
  try {
    const res = await axios.get(`${API_URL}/inscripciones/${inscripcionId}/comprobante`, {
      headers: authHeader(),
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    if (ventana) ventana.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    if (ventana) ventana.close();
    throw err;
  }
};

export const mensajeError = (err, porDefecto = "Ocurrió un error") =>
  err?.response?.data?.mensaje || porDefecto;
