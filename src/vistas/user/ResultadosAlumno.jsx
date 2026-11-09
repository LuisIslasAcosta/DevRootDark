import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/EstilosAlumno.css";
import { API_URL } from "../../config";

const nivelNota = (c) => (c >= 80 ? "resultado--alto" : c >= 60 ? "resultado--medio" : "resultado--bajo");

function ResultadosAlumno() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!usuario?.id) return;
    axios.get(`${API_URL}/respuestas/alumno/${usuario.id}`)
      .then(res => setResultados(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("No se pudieron cargar tus resultados."))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promedio = resultados.length
    ? Math.round(resultados.reduce((s, r) => s + (Number(r.calificacion) || 0), 0) / resultados.length)
    : 0;

  return (
    <div>
      <h2>Mis resultados</h2>

      {cargando && <p>Cargando resultados...</p>}
      {!cargando && error && <p className="text-danger">{error}</p>}
      {!cargando && !error && resultados.length === 0 && (
        <p>Aún no has respondido ningún examen.</p>
      )}

      {resultados.length > 0 && (
        <>
          <div className="resultados-resumen">
            <div><small>Exámenes respondidos</small><b>{resultados.length}</b></div>
            <div><small>Promedio general</small><b className={nivelNota(promedio)}>{promedio}%</b></div>
          </div>

          <div className="resultados-grid">
            {resultados.map(r => {
              const cal = Number(r.calificacion) || 0;
              return (
                <article key={r.id} className={`resultado-tarjeta ${nivelNota(cal)}`}>
                  <h3 className="resultado-tarjeta__titulo" style={{ color: "var(--text-color)" }}>
                    {r.examen_titulo || "Examen"}
                  </h3>
                  <div className="resultado-tarjeta__nota">
                    <strong>{cal}%</strong>
                    <span style={{ color: "var(--text-color)" }}>{r.correctas} de {r.total} correctas</span>
                  </div>
                  <div className="resultado-barra" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, Math.max(0, cal))}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ResultadosAlumno;
