import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function AlumnosCursoProfesor() {
  const { cursoId } = useParams();
  const [alumnos, setAlumnos] = useState([]);
  const [cursoNombre, setCursoNombre] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setCursoNombre(res.data.nombre));

    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}/alumnos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setAlumnos(res.data || []))
    .catch(() => alert("Error cargando alumnos"));
  }, [cursoId]);

  return (
    <div>
      <h3>Alumnos del curso: {cursoNombre}</h3>
      {alumnos.length === 0 ? (
        <p>No hay alumnos en este curso.</p>
      ) : (
        <ul>
          {alumnos.map(a => (
            <li key={a.id || a.alumno_id}>
              {a.nombre || a.full_name || a.alumno_nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AlumnosCursoProfesor;
