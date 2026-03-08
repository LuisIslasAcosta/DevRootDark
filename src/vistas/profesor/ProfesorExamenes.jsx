import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ProfesorExamenes() {
  const { cursoId } = useParams();
  const [examenes, setExamenes] = useState([]);
  const [cursoNombre, setCursoNombre] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setCursoNombre(res.data.nombre));

    axios.get(`http://127.0.0.1:5000/api/examenes/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setExamenes(res.data || []))
    .catch(() => alert("Error cargando exámenes"));
  }, [cursoId]);

  const eliminarExamen = async (exId) => {
    if (!window.confirm("¿Eliminar este examen?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:5000/api/examenes/${exId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExamenes(prev => prev.filter(ex => ex.id !== exId));
      alert("Examen eliminado ");
    } catch {
      alert("Error al eliminar ");
    }
  };

  return (
    <div>
      <h3>Exámenes del curso: {cursoNombre}</h3>
      {examenes.length === 0 ? (
        <p>No hay exámenes en este curso.</p>
      ) : (
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
                  <button className="btn-eliminar" onClick={() => eliminarExamen(ex.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProfesorExamenes;
