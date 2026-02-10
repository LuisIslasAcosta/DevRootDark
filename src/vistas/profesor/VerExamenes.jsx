import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Examenes.css";

function VerExamenes() {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [examenes, setExamenes] = useState([]);

  // 🔹 Cargar cursos del profesor
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/api/mis_cursos", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setCursos(res.data);
      } catch (err) {
        console.error("Error al cargar cursos:", err);
      }
    };
    cargarCursos();
  }, []);

  // 🔹 Cargar exámenes del curso seleccionado
  useEffect(() => {
    const cargarExamenes = async () => {
      if (!cursoSeleccionado) {
        setExamenes([]);
        return;
      }

      try {
        const res = await axios.get(
          `http://127.0.0.1:5000/api/examenes/curso/${cursoSeleccionado}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setExamenes(res.data);
      } catch (err) {
        console.error("Error al cargar exámenes:", err);
      }
    };
    cargarExamenes();
  }, [cursoSeleccionado]);

  // 🔹 Eliminar examen
  const eliminarExamen = async (id) => {
    const confirmar = window.confirm("¿Deseas eliminar este examen?");
    if (!confirmar) return;

    try {
      await axios.delete(`http://127.0.0.1:5000/api/examenes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Examen eliminado ✅");
      setExamenes(examenes.filter(ex => ex.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar examen ❌");
    }
  };

  return (
    <div className="examen-section">
      <h2>Ver Exámenes</h2>

      <div className="form-group">
        <label>Selecciona un curso</label>
        <select
          value={cursoSeleccionado}
          onChange={e => setCursoSeleccionado(e.target.value)}
        >
          <option value="">-- Selecciona un curso --</option>
          {cursos.map(curso => (
            <option key={curso.id} value={curso.id}>{curso.nombre}</option>
          ))}
        </select>
      </div>

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
                <td>{ex.preguntas.length}</td>
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
        cursoSeleccionado && <p>No hay exámenes en este curso.</p>
      )}
    </div>
  );
}

export default VerExamenes;
