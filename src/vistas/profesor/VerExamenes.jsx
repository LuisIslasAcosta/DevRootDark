import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Examenes.css";

function VerExamenes() {
  const { cursoId } = useParams(); 
  const [examenes, setExamenes] = useState([]);
  const [cursoNombre, setCursoNombre] = useState("");

  // 🔹 Cargar información del curso
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!cursoId) return;

    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setCursoNombre(res.data.nombre || "Curso"))
    .catch(() => setCursoNombre("Curso"));
  }, [cursoId]);

  // 🔹 Cargar exámenes del curso
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!cursoId) return;

    axios.get(`http://127.0.0.1:5000/api/examenes/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setExamenes(res.data || []))
    .catch(() => alert("Error al cargar exámenes"));
  }, [cursoId]);

  // 🔹 Eliminar examen
  const eliminarExamen = async (id) => {
    if (!window.confirm("¿Deseas eliminar este examen?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:5000/api/examenes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Examen eliminado ");
      setExamenes(prev => prev.filter(ex => ex.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar examen ");
    }
  };

  return (
    <div className="examen-section">
      <h2>Exámenes del curso: {cursoNombre}</h2>

      {examenes.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha</th>
              <th># Preguntas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {examenes.map(ex => (
              <tr key={ex.id}>
                <td>{ex.titulo}</td>
                <td>{ex.fecha}</td>
                <td>{ex.preguntas?.length || 0}</td>
                <td>
                  <button
                    className="custom-btn btn-eliminar"
                    onClick={() => eliminarExamen(ex.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay exámenes en este curso.</p>
      )}
    </div>
  );
}

export default VerExamenes;
