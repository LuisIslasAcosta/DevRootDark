import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import { API_URL } from "../../config";

function AlumnosCursoProfesor() {
  // La ruta es /profesor/cursos/:id/alumnos
  const { id: cursoId } = useParams();
  const [alumnos, setAlumnos] = useState([]);
  const [cursoNombre, setCursoNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cursoId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    let activo = true;

    axios.get(`${API_URL}/cursos/${cursoId}`, { headers })
      .then(res => activo && setCursoNombre(res.data?.nombre || ""))
      .catch(() => {});

    axios.get(`${API_URL}/cursos/${cursoId}/alumnos`, { headers })
      .then(res => activo && setAlumnos(Array.isArray(res.data) ? res.data : []))
      .catch(() => activo && setError("No se pudieron cargar los alumnos."))
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, [cursoId]);

  return (
    <div className="examen-section">
      <h2>Alumnos del curso{cursoNombre ? `: ${cursoNombre}` : ""}</h2>

      {cargando && <p>Cargando alumnos...</p>}
      {!cargando && error && <p className="text-danger">{error}</p>}
      {!cargando && !error && alumnos.length === 0 && <p>No hay alumnos inscritos en este curso.</p>}

      {!cargando && alumnos.length > 0 && (
        <>
          <p>Total de alumnos inscritos: <strong>{alumnos.length}</strong></p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a, i) => (
                <tr key={a.id || a.alumno_id || i}>
                  <td>{i + 1}</td>
                  <td>{a.alumno_nombre || a.nombre || "Sin nombre"}</td>
                  <td>{a.alumno_email || a.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default AlumnosCursoProfesor;
