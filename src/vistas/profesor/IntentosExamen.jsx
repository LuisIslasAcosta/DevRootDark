import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

// Nombre legible de cada alerta que marca el servidor
const ALERTAS = {
  reloj_del_dispositivo_alterado: "Reloj del dispositivo alterado",
  tiempo_excedido: "Se pasó del tiempo",
  empezado_despues_de_vencer: "Lo empezó ya vencido",
  inicio_no_coincide: "La hora de inicio no coincide",
  respuestas_no_validas: "Respuestas que no eran opciones",
  examen_descargado_varias_veces: "Descargado varias veces",
  salio_del_examen: "Salió del examen",
  enviado_automaticamente: "Enviado automáticamente",
};

const fecha = (iso) => (iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—");
const minutos = (ms) => (ms ? `${Math.round(ms / 60000)} min` : "—");

// Intentos de un examen con sus alertas (para que el profesor revise posibles trampas)
function IntentosExamen({ examenId, examenTitulo, onCerrar }) {
  const [intentos, setIntentos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/intentos/examen/${examenId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => setIntentos(res.data || []))
      .catch((err) => setError(err.response?.data?.mensaje || "No se pudieron cargar los intentos"));
  }, [examenId]);

  return (
    <div className="examen-section" style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Intentos: {examenTitulo}</h3>
        <button type="button" className="custom-btn btn-ver" onClick={onCerrar}>Cerrar</button>
      </div>

      {error && <p className="pf-error">{error}</p>}
      {!intentos && !error && <p>Cargando intentos...</p>}
      {intentos?.length === 0 && <p>Aún nadie presenta este examen con la versión nueva.</p>}

      {intentos?.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Intento</th>
              <th>Calificación</th>
              <th>Modo</th>
              <th>Inicio</th>
              <th>Recibido</th>
              <th>Duración</th>
              <th>Alertas</th>
            </tr>
          </thead>
          <tbody>
            {intentos.map((i) => (
              <tr key={i.intento_id} style={i.requiere_revision ? { background: "rgba(245, 158, 11, 0.12)" } : undefined}>
                <td>{i.alumno}</td>
                <td>{i.numero}</td>
                <td>{i.estado === "enviado" ? `${i.calificacion}%` : i.estado}</td>
                <td>{i.sin_conexion ? "Sin conexión" : "En línea"}</td>
                <td>{fecha(i.iniciado_en)}</td>
                <td>{fecha(i.recibido_en)}</td>
                <td>{minutos(i.duracion_ms)}</td>
                <td>
                  {i.requiere_revision && <strong style={{ color: "#b45309" }}>Revisar · </strong>}
                  {(i.banderas || []).map((b) => ALERTAS[b] || b).join(", ") || "Sin alertas"}
                  {i.motivo_envio && <div><small>{i.motivo_envio}</small></div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default IntentosExamen;
