import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import axios from "axios";

import "../styles/EstilosAlumno.css";
import "../../temas/temas.css";
import { API_URL, API_ORIGIN } from "../../config";
import EstadoInscripcion from "../../componentes/EstadoInscripcion";
import { obtenerMisInscripciones } from "../../componentes/pagos";
import "../../componentes/pagos.css";

function Cursos() {
  const { id } = useParams();

  const [curso, setCurso] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivelAbierto, setNivelAbierto] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [leccionesVistas, setLeccionesVistas] = useState({});
  const [user, setUser] = useState(null);
  const [inscripcion, setInscripcion] = useState(undefined); // undefined = cargando, null = sin inscripción

  // ================= LOAD USER =================
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      try {
        setUser(JSON.parse(usuarioGuardado));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // ================= VERIFICAR INSCRIPCIÓN ACEPTADA =================
  useEffect(() => {
    obtenerMisInscripciones()
      .then(res => setInscripcion((res.data || []).find(i => i.curso_id === id) || null))
      .catch(() => setInscripcion(null));
  }, [id]);

  // ================= CARGAR CURSO =================
  useEffect(() => {
    const cargarCurso = async () => {
      try {
        const res = await axios.get(`${API_URL}/cursos/${id}`);
        setCurso(res.data);
      } catch (err) {
        console.error("Error al cargar curso:", err);
      }
    };
    cargarCurso();
  }, [id]);

  // ================= CARGAR PROGRESO DEL ESTUDIANTE =================
  useEffect(() => {
    const cargarProgreso = async () => {
      if (!user?.id || !id) return;
      
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/analisis/progreso/estudiante/${user.id}/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.data && res.data.resumen) {
          setProgreso(res.data.resumen);
        }
      } catch (err) {
        console.error("Error al cargar progreso:", err);
      }
    };
    
    cargarProgreso();
  }, [user, id]);

  // ================= CARGAR NIVELES CON LECCIONES =================
  useEffect(() => {
    const cargarNiveles = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/niveles/curso/${id}/con_lecciones`
        );
        const nivelesConExamenes = await Promise.all(
          res.data.map(async (nivel) => {
              const leccionesConExamenes = await Promise.all(
                nivel.lecciones.map(async (leccion) => {
                  // Traer los exámenes por lección
                  try {
                    const examRes = await axios.get(
                      `${API_URL}/examenes/leccion/${leccion.id}`
                    );
                    return { ...leccion, examenes: examRes.data || [] };
                  } catch {
                    return { ...leccion, examenes: [] };
                  }
                })
              );
              
              // Traer los exámenes del nivel
              let examenesNivel = [];
              try {
                const examNivelRes = await axios.get(
                  `${API_URL}/examenes/nivel/${nivel.id}`
                );
                examenesNivel = examNivelRes.data || [];
              } catch (err) {
                console.error(`Error al cargar exámenes del nivel ${nivel.id}:`, err);
              }
            return { ...nivel, lecciones: leccionesConExamenes, examenesNivel };
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

  // ================= MARCAR LECCIÓN COMO VISTA =================
  const marcarLeccionVista = async (leccionId) => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/analisis/progreso/leccion/vista`,
        {
          alumno_id: user.id,
          leccion_id: leccionId,
          curso_id: id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar estado local
      setLeccionesVistas(prev => ({ ...prev, [leccionId]: true }));
      
      // Recargar progreso
      const res = await axios.get(
        `${API_URL}/analisis/progreso/estudiante/${user.id}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.resumen) {
        setProgreso(res.data.resumen);
      }
    } catch (err) {
      console.error("Error al marcar lección como vista:", err);
    }
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

  const esAlumno = (localStorage.getItem("rol") || "usuario") === "usuario";
  if (esAlumno && inscripcion !== undefined && inscripcion?.estado !== "aceptada") {
    return (
      <div className="curso-bloqueado">
        <h3>{curso.nombre}</h3>
        {inscripcion ? (
          <>
            <p><EstadoInscripcion estado={inscripcion.estado} /></p>
            <p>Tu ID de pago es <code>{inscripcion.referencia_pago}</code>.</p>
            {inscripcion.estado === "rechazada" && <p className="insc-motivo">Motivo: {inscripcion.motivo_rechazo}</p>}
            <p>Podrás ver las lecciones cuando tu profesor valide el pago.</p>
          </>
        ) : (
          <p>Aún no estás inscrito en este curso.</p>
        )}
        <Link to="/principal/mis-cursos" className="btn-modern">Ir a Mis cursos</Link>
      </div>
    );
  }

  return (
    <Container className="curso-info">
      {/* HEADER */}
      <div className="curso-header">
        <h2>{curso.nombre}</h2>
        <p className="curso-desc">{curso.descripcion}</p>
      </div>

      {/* BARRA DE PROGRESO */}
      {progreso && (
        <div className="progreso-container">
          <div className="progreso-header">
            <h4>Tu Progreso</h4>
            <span className="progreso-porcentaje">{progreso.progreso_global}%</span>
          </div>
          <div className="progreso-bar">
            <div 
              className="progreso-fill" 
              style={{ width: `${progreso.progreso_global}%` }}
            ></div>
          </div>
          <div className="progreso-detalles">
            <span>Lecciones: {progreso.lecciones_completadas}</span>
            <span> Exámenes: {progreso.examenes_realizados}</span>
          </div>
        </div>
      )}

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
                src={`${API_ORIGIN}${getArchivoURL(img)}`}
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
                src={`${API_ORIGIN}${getArchivoURL(vid)}`}
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
                              const url = `${API_ORIGIN}${getArchivoURL(archivo)}`;
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

                        {/* BOTÓN MARCAR COMO VISTA */}
                        {!leccionesVistas[leccion.id] && (
                          <button 
                            className="btn-marcar-vista"
                            onClick={() => marcarLeccionVista(leccion.id)}
                          >
                            ✓ Marcar como vista
                          </button>
                        )}
                        {leccionesVistas[leccion.id] && (
                          <span className="leccion-vista-badge">✓ Vista</span>
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
              
              {/* EXÁMENES DEL NIVEL */}
              {nivel.examenesNivel?.length > 0 && (
                <div className="nivel-examenes">
                  <h6> Exámenes de este nivel</h6>
                  {nivel.examenesNivel.map(examen => (
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
      </section>
    </Container>
  );
}

export default Cursos;
