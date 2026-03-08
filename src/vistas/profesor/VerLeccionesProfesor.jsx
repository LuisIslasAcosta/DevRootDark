import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function VerLeccionesProfesor() {
  const { id } = useParams(); // curso_id
  const navigate = useNavigate();

  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/lecciones/curso/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        setLecciones(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando lecciones:", err);
        setLoading(false);
      });
  }, [id]);

  const eliminarLeccion = async (leccionId) => {
    if (!window.confirm("¿Eliminar esta lección?")) return;

    try {
      await axios.delete(`http://127.0.0.1:5000/api/lecciones/${leccionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setLecciones(prev => prev.filter(l => l.id !== leccionId));
    } catch {
      alert("Error al eliminar ");
    }
  };

  if (loading) return <p>Cargando lecciones...</p>;

  return (
    <div className="container mt-4">
      <h2> Lecciones del curso</h2>

      <button
        className="btn btn-primary mb-3"
        onClick={() => navigate(`/profesor/cursos/${id}/lecciones/crear`)}
      >
         Crear nueva lección
      </button>

      {lecciones.length === 0 && (
        <p>No hay lecciones aún.</p>
      )}

      {lecciones.map(leccion => (
        <div key={leccion.id} className="card mb-3 p-3">
          <h5>{leccion.titulo}</h5>
          <p>{leccion.contenido}</p>

          {leccion.archivos?.length > 0 && (
            <div className="mt-2">
              <strong>Archivos:</strong>
              <ul>
                {leccion.archivos.map((a, i) => (
                  <li key={i}>
                    <a href={`http://127.0.0.1:5000/uploads/${a}`} target="_blank">
                      {a}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="btn btn-danger mt-2"
            onClick={() => eliminarLeccion(leccion.id)}
          >
             Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}

export default VerLeccionesProfesor;
