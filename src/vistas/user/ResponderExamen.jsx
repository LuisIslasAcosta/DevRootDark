import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/EstilosAlumno.css";

function ResponderExamen() {
  const { id: examenId } = useParams();
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [motivoAuto, setMotivoAuto] = useState(false);

  // Refs para leer siempre el valor más reciente dentro de los listeners
  const respuestasRef = useRef({});
  const enviadoRef = useRef(false);
  const preguntasRef = useRef([]);

  useEffect(() => { respuestasRef.current = respuestas; }, [respuestas]);
  useEffect(() => { preguntasRef.current = preguntas; }, [preguntas]);

  /* CARGAR PREGUNTAS */

  useEffect(() => {
    if (!examenId) return;

    const fetchPreguntas = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:5000/api/preguntas/examen/${examenId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        setPreguntas(res.data || []);
      } catch (err) {
        console.error("Error al cargar preguntas:", err);
        alert("No se pudieron cargar las preguntas");
      } finally {
        setLoading(false);
      }
    };

    fetchPreguntas();
  }, [examenId]);

  const handleChange = (preguntaId, opcion) => {
    if (enviadoRef.current) return;
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }));
  };

  /* ENVIAR (manual o automático) */

  const enviar = useCallback(async (automatico = false) => {
    // Evita enviar dos veces o antes de que carguen las preguntas
    if (enviadoRef.current || preguntasRef.current.length === 0) return;

    const respuestasActuales = respuestasRef.current;

    // Envío manual: exige responder todo. Automático: manda lo que haya.
    if (!automatico && Object.keys(respuestasActuales).length !== preguntasRef.current.length) {
      alert("Debes responder todas las preguntas");
      return;
    }

    enviadoRef.current = true;
    setEnviado(true);
    setMotivoAuto(automatico);

    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      const res = await axios.post(
        "http://127.0.0.1:5000/api/respuestas",
        {
          alumno_id: usuario.id,
          examen_id: examenId,
          respuestas: respuestasActuales
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      setResultado(res.data.calificacion);
    } catch (err) {
      console.error(err);
      // Permite reintentar solo si fue un envío manual
      if (!automatico) {
        enviadoRef.current = false;
        setEnviado(false);
      }
      alert("Error al enviar respuestas");
    }
  }, [examenId]);

  /* DETECTAR CAMBIO DE PESTAÑA */

  useEffect(() => {
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        enviar(true);
      }
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [enviar]);

  if (loading) return <p>Cargando preguntas...</p>;

  /* PANTALLA DE RESULTADO */

  if (enviado) {
    return (
      <div className="responder-examen">
        <h2>Examen enviado</h2>

        {motivoAuto && (
          <p className="pf-error" style={{ marginBottom: "1rem" }}>
            Cambiaste de pestaña o minimizaste la ventana, por lo que el examen
            se envió automáticamente con las respuestas que tenías.
          </p>
        )}

        <div className="resultado-card">
          <p>Calificación</p>
          <p>{resultado !== null ? `${resultado}` : "Calculando..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="responder-examen">
      <h2>Responder Examen</h2>

      {preguntas.length > 0 && (
        <p style={{ marginBottom: "1rem" }}>
          <strong>Aviso:</strong> si cambias de pestaña o minimizas la ventana,
          el examen se enviará automáticamente con las respuestas que lleves.
        </p>
      )}

      {preguntas.length === 0 && <p>No hay preguntas disponibles.</p>}

      {preguntas.map((p, index) => {
        const opcionesValidas = (p.opciones || []).filter(op => op && op.trim() !== "");

        return (
          <div key={p.id} className="pregunta-item">
            <p><strong>{index + 1}. {p.enunciado}</strong></p>

            {opcionesValidas.length === 0 && (
              <p style={{ color: "red" }}>Esta pregunta no tiene opciones válidas</p>
            )}

            {opcionesValidas.map((op, i) => (
              <label key={i} style={{ display: "block", marginBottom: "6px" }}>
                <input
                  type="radio"
                  name={`pregunta_${p.id}`}
                  value={op}
                  checked={respuestas[p.id] === op}
                  onChange={() => handleChange(p.id, op)}
                />
                {op}
              </label>
            ))}
          </div>
        );
      })}

      {preguntas.length > 0 && (
        <button onClick={() => enviar(false)} className="custom-btn btn-enviar">
          Enviar Respuestas
        </button>
      )}
    </div>
  );
}

export default ResponderExamen;