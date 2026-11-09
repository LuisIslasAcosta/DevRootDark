import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import { API_URL, urlArchivo } from "../../config";
function VerLeccionesProfesor() {
  const { id } = useParams(); // curso_id
  const navigate = useNavigate();

  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/lecciones/curso/${id}`, {
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
      await axios.delete(`${API_URL}/lecciones/${leccionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setLecciones(prev => prev.filter(l => l.id !== leccionId));
    } catch {
      alert("Error al eliminar ");
    }
  };

  if (loading) return <p>Cargando lecciones...</p>;

  return (
    <div className="examen-section">
      <h2>Lecciones del curso</h2>

      <div className="seccion-acciones">
        <button
          type="button"
          className="custom-btn btn-crear"
          onClick={() => navigate(`/profesor/cursos/${id}/lecciones/crear`)}
        >
          + Crear nueva lección
        </button>
      </div>

      {lecciones.length === 0 && <p>No hay lecciones aún.</p>}

      <div className="lecciones-lista">
        {lecciones.map(leccion => (
          <article key={leccion.id} className="leccion-card">
            <div className="leccion-card__cabecera">
              <h3>{leccion.titulo}</h3>
              <button
                type="button"
                className="custom-btn btn-eliminar"
                onClick={() => eliminarLeccion(leccion.id)}
              >
                Eliminar
              </button>
            </div>
            {leccion.contenido && <p>{leccion.contenido}</p>}

            {leccion.archivos?.length > 0 && (
              <ul className="leccion-archivos">
                {leccion.archivos.map((a, i) => (
                  <li key={i}>
                    <a href={urlArchivo(a)} target="_blank" rel="noreferrer">📎 {a}</a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default VerLeccionesProfesor;
