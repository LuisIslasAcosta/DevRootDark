import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function ResponderExamen() {
  const { id: examenId } = useParams(); //  FIX
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);

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

        console.log("Examen ID:", examenId);
        console.log("Preguntas recibidas:", res.data);

        setPreguntas(res.data || []);
      } catch (err) {
        console.error("Error al cargar preguntas:", err);
        alert("No se pudieron cargar las preguntas ");
      } finally {
        setLoading(false);
      }
    };

    fetchPreguntas();
  }, [examenId]);

  const handleChange = (preguntaId, opcion) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }));
  };

  const enviar = async () => {
    if (Object.keys(respuestas).length !== preguntas.length) {
      alert("Debes responder todas las preguntas ");
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      const res = await axios.post(
        "http://127.0.0.1:5000/api/respuestas",
        {
          alumno_id: usuario.id,
          examen_id: examenId,
          respuestas
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      alert(`Calificación: ${res.data.calificacion} `);
    } catch (err) {
      console.error(err);
      alert("Error al enviar respuestas ");
    }
  };

  if (loading) return <p>Cargando preguntas...</p>;

  return (
    <div className="responder-examen">
      <h2>Responder Examen</h2>

      {preguntas.length === 0 && <p>No hay preguntas disponibles.</p>}

      {preguntas.map((p, index) => {
        const opcionesValidas = (p.opciones || []).filter(op => op && op.trim() !== "");

        return (
          <div key={p.id} className="pregunta-item">
            <p><strong>{index + 1}. {p.enunciado}</strong></p>

            {opcionesValidas.length === 0 && (
              <p style={{ color: "red" }}>⚠️ Esta pregunta no tiene opciones válidas</p>
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
        <button onClick={enviar} className="custom-btn btn-enviar">
          Enviar Respuestas
        </button>
      )}
    </div>
  );
}

export default ResponderExamen;
