import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaChalkboardTeacher, FaImage, FaVideo, FaTimes } from "react-icons/fa";
import "../styles/Curso_Detalle.css";

const API = "https://defense-situation-bouquet-aqua.trycloudflare.com//api";

function CursoDetalle() {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [error, setError] = useState(false);
  const [imagenAbierta, setImagenAbierta] = useState(null);

  useEffect(() => {
    setCurso(null);
    setError(false);
    fetch(`${API}/cursos/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Curso no encontrado");
        return res.json();
      })
      .then(setCurso)
      .catch((err) => {
        console.error("Error al cargar curso:", err);
        setError(true);
      });
  }, [id]);

  // Cerrar el visor de imágenes con Escape
  useEffect(() => {
    if (!imagenAbierta) return;
    const onKey = (e) => e.key === "Escape" && setImagenAbierta(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imagenAbierta]);

  if (error) {
    return (
      <div className="curso-detalle">
        <div className="cd-estado">
          <p>No se pudo cargar el curso. Revisa que el servidor esté activo e inténtalo de nuevo.</p>
          <Link to="/admin/cursos" className="cd-volver">
            <FaArrowLeft /> Volver a cursos
          </Link>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="curso-detalle">
        <div className="cd-estado">
          <div className="cd-spinner" aria-hidden="true" />
          <p>Cargando curso...</p>
        </div>
      </div>
    );
  }

  const imagenes = curso.imagenes || [];
  const videos = curso.videos || [];

  return (
    <div className="curso-detalle">
      <Link to="/admin/cursos" className="cd-volver">
        <FaArrowLeft /> Volver a cursos
      </Link>

      <header className="cd-header">
        <h2>{curso.nombre}</h2>
        <span className="cd-profesor">
          <FaChalkboardTeacher /> {curso.profesor}
        </span>
      </header>

      <section className="cd-panel">
        <h4>Descripción</h4>
        <p className="cd-descripcion">{curso.descripcion || "Este curso aún no tiene descripción."}</p>
      </section>

      <section className="cd-panel">
        <h4>
          <FaImage /> Imágenes <span className="cd-conteo">{imagenes.length}</span>
        </h4>
        {imagenes.length === 0 ? (
          <p className="cd-vacio">Este curso no tiene imágenes.</p>
        ) : (
          <div className="cd-galeria">
            {imagenes.map((img, i) => {
              const src = `${API}/uploads/imagenes/${img}`;
              return (
                <button
                  key={i}
                  type="button"
                  className="cd-thumb"
                  onClick={() => setImagenAbierta(src)}
                  aria-label={`Ampliar imagen ${i + 1}`}
                >
                  <img src={src} alt={`Imagen ${i + 1} del curso`} loading="lazy" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="cd-panel">
        <h4>
          <FaVideo /> Videos <span className="cd-conteo">{videos.length}</span>
        </h4>
        {videos.length === 0 ? (
          <p className="cd-vacio">Este curso no tiene videos.</p>
        ) : (
          <div className="cd-videos">
            {videos.map((vid, i) => (
              <video
                key={i}
                src={`${API}/uploads/videos/${vid}`}
                controls
                preload="metadata"
                playsInline
              />
            ))}
          </div>
        )}
      </section>

      {imagenAbierta && (
        <div className="cd-visor" onClick={() => setImagenAbierta(null)} role="dialog" aria-modal="true">
          <button type="button" className="cd-cerrar" onClick={() => setImagenAbierta(null)} aria-label="Cerrar">
            <FaTimes />
          </button>
          <img src={imagenAbierta} alt="Imagen ampliada" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default CursoDetalle;