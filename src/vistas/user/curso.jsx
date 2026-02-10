import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import "../styles/curso.css";
import "../../temas/temas.css";

function Cursos() {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/cursos/${id}`)
      .then(res => res.json())
      .then(data => {
        setCurso(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar curso:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="curso-loading">Cargando curso...</p>;
  if (!curso) return <p className="curso-error">No se encontró el curso</p>;

  return (
    <Container className="curso-info">

      {/* HEADER */}
      <div className="curso-header">
        <h2>{curso.nombre}</h2>
        <p className="curso-desc">{curso.descripcion}</p>
      </div>

      {/* INFO */}
      <div className="curso-meta">
        {curso.profesor && <span>Profesor: {curso.profesor}</span>}
      </div>

      {/* IMÁGENES */}
      {curso.imagenes?.length > 0 && (
        <section className="curso-media-section">
          <h4>Imágenes</h4>
          <div className="curso-media-grid">
            {curso.imagenes.map((img, i) => (
              <img
                key={i}
                src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                alt={`imagen-${i}`}
                className="curso-media-img"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {/* VIDEOS (ARCHIVOS LOCALES) */}
      {curso.videos?.length > 0 && (
        <section className="curso-media-section">
          <h4>Videos</h4>
          <div className="curso-media-grid">
            {curso.videos.map((vid, i) => (
              <video
                key={i}
                src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`}
                controls
                className="curso-video-player"
              >
                Tu navegador no soporta video
              </video>
            ))}
          </div>
        </section>
      )}

    </Container>
  );
}

export default Cursos;
