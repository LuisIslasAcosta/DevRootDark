import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import axios from "axios";

import "../styles/curso.css";
import "../../temas/temas.css";

function Cursos() {
  const { id } = useParams();

  const [curso, setCurso] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivelAbierto, setNivelAbierto] = useState(null);

  // ================= CARGAR CURSO =================
  useEffect(() => {
    const cargarCurso = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/api/cursos/${id}`);
        setCurso(res.data);
      } catch (err) {
        console.error("Error al cargar curso:", err);
      }
    };
    cargarCurso();
  }, [id]);

  // ================= CARGAR NIVELES CON LECCIONES =================
  useEffect(() => {
    const cargarNiveles = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:5000/api/niveles/curso/${id}/con_lecciones`
        );
        const nivelesConExamenes = await Promise.all(
          res.data.map(async (nivel) => {
            const leccionesConExamenes = await Promise.all(
              nivel.lecciones.map(async (leccion) => {
                // Traer los exámenes por lección
                try {
                  const examRes = await axios.get(
                    `http://127.0.0.1:5000/api/examenes/leccion/${leccion.id}`
                  );
                  return { ...leccion, examenes: examRes.data || [] };
                } catch {
                  return { ...leccion, examenes: [] };
                }
              })
            );
            return { ...nivel, lecciones: leccionesConExamenes };
          })
        );
        setNiveles(nivelesConExamenes);
      } catch (err) {
        console.error("Error al cargar niveles:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarNiveles();
  }, [id]);

  const toggleNivel = (nivelId) => {
    setNivelAbierto(nivelAbierto === nivelId ? null : nivelId);
  };

  // ================= UTILS =================
  const getArchivoURL = (archivo) => {
    const ext = archivo.split(".").pop().toLowerCase();
    if (["png","jpg","jpeg","gif"].includes(ext)) return `/api/uploads/imagenes/${archivo}`;
    if (["mp4"].includes(ext)) return `/api/uploads/videos/${archivo}`;
    if (["pdf"].includes(ext)) return `/api/uploads/pdfs/${archivo}`;
    return `/api/uploads/${archivo}`;
  };

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
        {curso.duracion && <span>Duración: {curso.duracion}</span>}
      </div>

      {/* IMÁGENES */}
      {curso.imagenes?.length > 0 && (
        <section className="curso-media-section">
          <h4>🖼 Imágenes</h4>
          <div className="curso-media-grid">
            {curso.imagenes.map((img, i) => (
              <img
                key={i}
                src={`http://127.0.0.1:5000${getArchivoURL(img)}`}
                alt={`imagen-${i}`}
                className="curso-media-img"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {/* VIDEOS */}
      {curso.videos?.length > 0 && (
        <section className="curso-media-section">
          <h4>🎥 Videos</h4>
          <div className="curso-media-grid">
            {curso.videos.map((vid, i) => (
              <video
                key={i}
                src={`http://127.0.0.1:5000${getArchivoURL(vid)}`}
                controls
                className="curso-video-player"
              />
            ))}
          </div>
        </section>
      )}

      {/* NIVELES Y LECCIONES */}
      <section className="curso-section">
        <h3> Niveles y Lecciones</h3>
        {niveles.length === 0 ? (
          <p>No hay niveles disponibles</p>
        ) : (
          niveles.map((nivel) => (
            <div key={nivel.id} className="nivel-card">
              <h4 className="nivel-titulo" onClick={() => toggleNivel(nivel.id)}>
                {nivel.titulo}{" "}
                <span className="nivel-toggle">{nivelAbierto === nivel.id ? "▲" : "▼"}</span>
              </h4>

              {nivelAbierto === nivel.id && (
                <div className="nivel-lecciones">
                  {nivel.lecciones?.length === 0 ? (
                    <p>No hay lecciones en este nivel</p>
                  ) : (
                    nivel.lecciones.map((leccion) => (
                      <div key={leccion.id} className="leccion-card">
                        <h5>{leccion.titulo}</h5>
                        {leccion.contenido && <p>{leccion.contenido}</p>}

                        {/* Archivos */}
                        {leccion.archivos?.length > 0 && (
                          <div className="leccion-archivos">
                            {leccion.archivos.map((archivo, i) => {
                              const url = `http://127.0.0.1:5000${getArchivoURL(archivo)}`;
                              const ext = archivo.split(".").pop().toLowerCase();

                              if (["png","jpg","jpeg","gif"].includes(ext)) {
                                return <img key={i} src={url} alt={archivo} className="leccion-img" />;
                              } else if (["mp4"].includes(ext)) {
                                return <video key={i} src={url} controls className="leccion-video" />;
                              } else if (["pdf"].includes(ext)) {
                                return (
                                  <a key={i} href={url} target="_blank" rel="noreferrer">
                                    {archivo}
                                  </a>
                                );
                              } else {
                                return (
                                  <a key={i} href={url} target="_blank" rel="noreferrer">
                                    {archivo}
                                  </a>
                                );
                              }
                            })}
                          </div>
                        )}

                        {/* EXÁMENES POR LECCIÓN */}
                        {leccion.examenes?.length > 0 && (
                          <div className="leccion-examenes">
                            <h6> Exámenes de esta lección</h6>
                            {leccion.examenes.map(examen => (
                              <div key={examen.id} className="curso-form-card">
                                <h5>{examen.titulo}</h5>
                                {examen.descripcion && <p>{examen.descripcion}</p>}
                                <Link to={`/principal/examen/${examen.id}`} className="btn-modern">
                                  Responder Examen
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </Container>
  );
}

export default Cursos;
