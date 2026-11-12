import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaBookOpen,
  FaCheck,
  FaChevronDown,
  FaClipboardCheck,
  FaComments,
  FaFilePdf,
  FaFileAlt,
  FaImages,
  FaLayerGroup,
  FaLightbulb,
  FaLock,
  FaPlay,
  FaChalkboardTeacher,
  FaRedo,
  FaTrophy,
  FaVideo
} from "react-icons/fa";

import "../styles/EstilosAlumno.css";
import "../styles/Cursos.css";
import "../../temas/temas.css";
import { API_URL, urlArchivo } from "../../config";
import EstadoInscripcion from "../../componentes/EstadoInscripcion";
import { obtenerMisInscripciones } from "../../componentes/pagos";
import { degradadoCurso, portadaCurso, inicialesCurso, colorCalificacion } from "../../componentes/cursoVisual";
import "../../componentes/pagos.css";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const extension = (archivo = "") => archivo.split(".").pop().toLowerCase();
const esImagen = (a) => ["png", "jpg", "jpeg", "gif", "webp"].includes(extension(a));
const esVideo = (a) => ["mp4", "webm"].includes(extension(a));
const nombreArchivo = (a = "") => a.replace(/^.*[\\/]/, "");

function Anillo({ valor, tamano = 112, grosor = 11 }) {
  const radio = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * radio;
  const lleno = Math.max(0, Math.min(100, valor || 0));
  return (
    <div className="cv-anillo" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} strokeWidth={grosor} className="cv-anillo-fondo" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          strokeWidth={grosor}
          className="cv-anillo-valor"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - lleno / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          fill="none"
        />
      </svg>
      <div className="cv-anillo-centro">
        <strong>{Math.round(lleno)}%</strong>
        <span>completado</span>
      </div>
    </div>
  );
}

function Cursos() {
  const { id } = useParams();

  const [curso, setCurso] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivelesAbiertos, setNivelesAbiertos] = useState({});
  const [leccionAbierta, setLeccionAbierta] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [vistasLocales, setVistasLocales] = useState({});
  const [marcando, setMarcando] = useState(null);
  const [pestana, setPestana] = useState("contenido");
  const [user, setUser] = useState(null);
  const [inscripcion, setInscripcion] = useState(undefined); // undefined = cargando, null = sin inscripción

  // ================= LOAD USER =================
  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("usuario")) || null);
    } catch {
      setUser(null);
    }
  }, []);

  // ================= VERIFICAR INSCRIPCIÓN ACEPTADA =================
  useEffect(() => {
    obtenerMisInscripciones()
      .then((res) => setInscripcion((res.data || []).find((i) => i.curso_id === id) || null))
      .catch(() => setInscripcion(null));
  }, [id]);

  // ================= CARGAR CURSO =================
  useEffect(() => {
    axios
      .get(`${API_URL}/cursos/${id}`)
      .then((res) => setCurso(res.data))
      .catch((err) => console.error("Error al cargar curso:", err));
  }, [id]);

  // ================= CARGAR PROGRESO =================
  const cargarProgreso = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${API_URL}/progreso/alumno/curso/${id}`, { headers: encabezados() });
      setProgreso(res.data);
    } catch (err) {
      console.error("Error al cargar progreso:", err);
    }
  }, [id]);

  useEffect(() => {
    cargarProgreso();
  }, [cargarProgreso]);

  // ================= CARGAR NIVELES CON LECCIONES Y EXÁMENES =================
  useEffect(() => {
    const cargarNiveles = async () => {
      try {
        const res = await axios.get(`${API_URL}/niveles/curso/${id}/con_lecciones`);
        const nivelesConExamenes = await Promise.all(
          (res.data || []).map(async (nivel) => {
            const lecciones = await Promise.all(
              (nivel.lecciones || []).map(async (leccion) => {
                try {
                  const examRes = await axios.get(`${API_URL}/examenes/leccion/${leccion.id}`);
                  return { ...leccion, examenes: examRes.data || [] };
                } catch {
                  return { ...leccion, examenes: [] };
                }
              })
            );
            let examenesNivel = [];
            try {
              const examNivelRes = await axios.get(`${API_URL}/examenes/nivel/${nivel.id}`);
              examenesNivel = examNivelRes.data || [];
            } catch (err) {
              console.error(`Error al cargar exámenes del nivel ${nivel.id}:`, err);
            }
            return { ...nivel, lecciones, examenesNivel };
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

  // ================= DATOS DERIVADOS =================
  const vistas = useMemo(() => {
    const set = new Set(progreso?.lecciones_vistas_ids || []);
    Object.keys(vistasLocales).forEach((k) => set.add(k));
    return set;
  }, [progreso, vistasLocales]);

  const calificaciones = useMemo(() => {
    const mapa = {};
    (progreso?.calificaciones || []).forEach((c) => {
      mapa[c.examen_id] = c;
    });
    return mapa;
  }, [progreso]);

  const aprobatoria = progreso?.calificacion_aprobatoria ?? 70;

  const estructura = useMemo(
    () =>
      niveles.map((nivel, indice) => {
        const examenes = [
          ...(nivel.lecciones || []).flatMap((l) => l.examenes || []),
          ...(nivel.examenesNivel || [])
        ];
        const unicos = examenes.filter((e, i) => examenes.findIndex((x) => x.id === e.id) === i);
        const totalLecciones = nivel.lecciones?.length || 0;
        const leccionesHechas = (nivel.lecciones || []).filter((l) => vistas.has(l.id)).length;
        const examenesHechos = unicos.filter((e) => calificaciones[e.id]?.calificacion !== null && calificaciones[e.id]?.calificacion !== undefined).length;
        const total = totalLecciones + unicos.length;
        const hechos = leccionesHechas + examenesHechos;
        return {
          ...nivel,
          numero: indice + 1,
          totalLecciones,
          leccionesHechas,
          totalExamenes: unicos.length,
          examenesHechos,
          avance: total ? Math.round((hechos / total) * 100) : 0,
          completo: total > 0 && hechos >= total
        };
      }),
    [niveles, vistas, calificaciones]
  );

  // Siguiente cosa por hacer: primera lección no vista o examen no presentado, en orden
  const siguiente = useMemo(() => {
    for (const nivel of estructura) {
      for (const leccion of nivel.lecciones || []) {
        if (!vistas.has(leccion.id)) return { tipo: "leccion", nivel, item: leccion };
        for (const examen of leccion.examenes || []) {
          if (!calificaciones[examen.id] || calificaciones[examen.id].calificacion === null) return { tipo: "examen", nivel, item: examen };
        }
      }
      for (const examen of nivel.examenesNivel || []) {
        if (!calificaciones[examen.id] || calificaciones[examen.id].calificacion === null) return { tipo: "examen", nivel, item: examen };
      }
    }
    return null;
  }, [estructura, vistas, calificaciones]);

  // Abre por defecto el nivel donde va el alumno
  useEffect(() => {
    if (!estructura.length) return;
    setNivelesAbiertos((prev) => {
      if (Object.keys(prev).length) return prev;
      const destino = siguiente?.nivel?.id || estructura[0].id;
      return { [destino]: true };
    });
  }, [estructura, siguiente]);

  // ================= ACCIONES =================
  const toggleNivel = (nivelId) => setNivelesAbiertos((prev) => ({ ...prev, [nivelId]: !prev[nivelId] }));

  const irA = (destino) => {
    if (!destino) return;
    setPestana("contenido");
    setNivelesAbiertos((prev) => ({ ...prev, [destino.nivel.id]: true }));
    if (destino.tipo === "leccion") setLeccionAbierta(destino.item.id);
    setTimeout(() => {
      document.getElementById(`item-${destino.item.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const marcarLeccionVista = async (leccionId) => {
    if (!user?.id || marcando) return;
    setMarcando(leccionId);
    try {
      await axios.post(
        `${API_URL}/analisis/progreso/leccion/vista`,
        { alumno_id: user.id, leccion_id: leccionId, curso_id: id },
        { headers: encabezados() }
      );
      setVistasLocales((prev) => ({ ...prev, [leccionId]: true }));
      cargarProgreso();
    } catch (err) {
      console.error("Error al marcar lección como vista:", err);
    } finally {
      setMarcando(null);
    }
  };

  // ================= ESTADOS DE CARGA =================
  if (loading && !curso) return <div className="cv-cargando"><span /> Cargando curso...</div>;
  if (!curso) return <div className="cv-vacio"><FaBookOpen /><p>No se encontró el curso.</p></div>;

  const portada = portadaCurso(curso);
  const fondoHero = portada
    ? { backgroundImage: `linear-gradient(100deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.72) 55%, rgba(15,23,42,.35) 100%), url("${portada}")` }
    : { backgroundImage: `${degradadoCurso(curso.nombre)}` };

  const esAlumno = (localStorage.getItem("rol") || "usuario") === "usuario";
  if (esAlumno && inscripcion !== undefined && inscripcion?.estado !== "aceptada") {
    return (
      <div className="cv">
        <header className="cv-hero cv-hero-bloqueado" style={fondoHero}>
          <div className="cv-hero-texto">
            <span className="cv-chip-claro"><FaLock /> Contenido bloqueado</span>
            <h1>{curso.nombre}</h1>
            {curso.descripcion && <p>{curso.descripcion}</p>}
          </div>
        </header>
        <div className="cv-bloqueado">
          {inscripcion ? (
            <>
              <EstadoInscripcion estado={inscripcion.estado} />
              <p>Tu ID de pago es <code>{inscripcion.referencia_pago}</code>.</p>
              {inscripcion.estado === "rechazada" && <p className="insc-motivo">Motivo: {inscripcion.motivo_rechazo}</p>}
              <p>Podrás ver las lecciones cuando tu profesor valide el pago.</p>
            </>
          ) : (
            <p>Aún no estás inscrito en este curso. Inscríbete desde el campus para ver las lecciones.</p>
          )}
          <Link to={inscripcion ? "/principal/mis-cursos" : `/principal#curso-${id}`} className="cv-btn">
            {inscripcion ? "Ir a Mis cursos" : "Ir al campus"}
          </Link>
        </div>
      </div>
    );
  }

  const totalLecciones = estructura.reduce((s, n) => s + n.totalLecciones, 0);
  const totalExamenes = estructura.reduce((s, n) => s + n.totalExamenes, 0);
  const avance = progreso?.progreso ?? 0;
  const terminado = progreso?.terminado;
  const material = [...(curso.imagenes || []), ...(curso.videos || [])];

  const renderExamen = (examen) => {
    const cal = calificaciones[examen.id];
    const presentado = cal && cal.calificacion !== null && cal.calificacion !== undefined;
    const color = presentado ? colorCalificacion(cal.calificacion, aprobatoria) : undefined;
    return (
      <li key={examen.id} id={`item-${examen.id}`} className={`cv-item cv-item-examen${presentado ? " hecho" : ""}`}>
        <span className="cv-item-icono" style={presentado ? { background: color } : undefined}>
          {presentado ? <FaCheck /> : <FaClipboardCheck />}
        </span>
        <div className="cv-item-texto">
          <span className="cv-item-tipo">Examen</span>
          <strong>{examen.titulo}</strong>
          {examen.descripcion && <small>{examen.descripcion}</small>}
        </div>
        {presentado && (
          <span className="cv-calificacion" style={{ color, borderColor: color }}>
            {Math.round(cal.calificacion)}%
          </span>
        )}
        <Link to={`/principal/examen/${examen.id}`} className={`cv-btn cv-btn-chico${presentado ? " cv-btn-suave" : ""}`}>
          {presentado ? <><FaRedo /> Repetir</> : <><FaPlay /> Presentar</>}
        </Link>
      </li>
    );
  };

  return (
    <div className="cv">
      {/* ================= PORTADA ================= */}
      <header className="cv-hero" style={fondoHero}>
        <div className="cv-hero-texto">
          <Link to="/principal/mis-cursos" className="cv-volver"><FaArrowLeft /> Mis cursos</Link>
          {!portada && <span className="cv-hero-iniciales" aria-hidden="true">{inicialesCurso(curso.nombre)}</span>}
          <h1>{curso.nombre}</h1>
          {curso.descripcion && <p>{curso.descripcion}</p>}
          <div className="cv-hero-chips">
            {(progreso?.profesor || curso.profesor) && (
              <span className="cv-chip-claro"><FaChalkboardTeacher /> {progreso?.profesor || curso.profesor}</span>
            )}
            <span className="cv-chip-claro"><FaLayerGroup /> {estructura.length} {estructura.length === 1 ? "nivel" : "niveles"}</span>
            <span className="cv-chip-claro"><FaBookOpen /> {totalLecciones} lecciones</span>
            <span className="cv-chip-claro"><FaClipboardCheck /> {totalExamenes} exámenes</span>
          </div>
          <div className="cv-hero-acciones">
            {siguiente ? (
              <button type="button" className="cv-btn cv-btn-blanco" onClick={() => irA(siguiente)}>
                <FaPlay /> {avance > 0 ? "Continuar donde me quedé" : "Empezar el curso"}
              </button>
            ) : terminado ? (
              <span className="cv-chip-logro"><FaTrophy /> ¡Curso completado!</span>
            ) : null}
            <Link to={`/principal/mensajes?curso=${id}`} className="cv-btn cv-btn-cristal">
              <FaComments /> Preguntar al profesor
            </Link>
          </div>
        </div>

        <div className="cv-hero-progreso">
          <Anillo valor={avance} />
          <dl>
            <div><dt>Lecciones</dt><dd>{progreso ? `${progreso.lecciones_vistas}/${progreso.total_lecciones}` : "—"}</dd></div>
            <div><dt>Exámenes</dt><dd>{progreso ? `${progreso.examenes_presentados}/${progreso.total_examenes}` : "—"}</dd></div>
            <div>
              <dt>Promedio</dt>
              <dd style={{ color: progreso?.promedio !== null && progreso?.promedio !== undefined ? colorCalificacion(progreso.promedio, aprobatoria) : undefined }}>
                {progreso?.promedio !== null && progreso?.promedio !== undefined ? `${progreso.promedio}%` : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="cv-layout">
        {/* ================= CONTENIDO ================= */}
        <main className="cv-principal">
          <div className="cv-pestanas" role="tablist">
            <button type="button" role="tab" aria-selected={pestana === "contenido"} className={pestana === "contenido" ? "activa" : ""} onClick={() => setPestana("contenido")}>
              <FaLayerGroup /> Contenido del curso
            </button>
            <button type="button" role="tab" aria-selected={pestana === "material"} className={pestana === "material" ? "activa" : ""} onClick={() => setPestana("material")}>
              <FaImages /> Material <span>{material.length}</span>
            </button>
          </div>

          {pestana === "contenido" && (
            estructura.length === 0 ? (
              <div className="cv-vacio"><FaLayerGroup /><p>Tu profesor aún no publica niveles en este curso.</p></div>
            ) : (
              <ol className="cv-niveles">
                {estructura.map((nivel) => {
                  const abierto = !!nivelesAbiertos[nivel.id];
                  return (
                    <li key={nivel.id} className={`cv-nivel${nivel.completo ? " completo" : ""}${abierto ? " abierto" : ""}`}>
                      <button type="button" className="cv-nivel-cabecera" onClick={() => toggleNivel(nivel.id)} aria-expanded={abierto}>
                        <span className="cv-nivel-numero">{nivel.completo ? <FaCheck /> : nivel.numero}</span>
                        <span className="cv-nivel-titulo">
                          <strong>{nivel.titulo}</strong>
                          <small>
                            {nivel.totalLecciones} {nivel.totalLecciones === 1 ? "lección" : "lecciones"} · {nivel.totalExamenes}{" "}
                            {nivel.totalExamenes === 1 ? "examen" : "exámenes"}
                          </small>
                        </span>
                        <span className="cv-nivel-avance">
                          <span className="cv-mini-barra"><span style={{ width: `${nivel.avance}%` }} /></span>
                          <small>{nivel.avance}%</small>
                        </span>
                        <FaChevronDown className="cv-nivel-flecha" />
                      </button>

                      {abierto && (
                        <ul className="cv-items">
                          {(nivel.lecciones || []).length === 0 && (nivel.examenesNivel || []).length === 0 && (
                            <li className="cv-item cv-item-vacio">Este nivel aún no tiene contenido.</li>
                          )}

                          {(nivel.lecciones || []).map((leccion) => {
                            const vista = vistas.has(leccion.id);
                            const expandida = leccionAbierta === leccion.id;
                            return (
                              <React.Fragment key={leccion.id}>
                                <li id={`item-${leccion.id}`} className={`cv-item cv-item-leccion${vista ? " hecho" : ""}${expandida ? " expandida" : ""}`}>
                                  <span className="cv-item-icono">{vista ? <FaCheck /> : <FaBookOpen />}</span>
                                  <button type="button" className="cv-item-texto cv-item-boton" onClick={() => setLeccionAbierta(expandida ? null : leccion.id)} aria-expanded={expandida}>
                                    <span className="cv-item-tipo">Lección</span>
                                    <strong>{leccion.titulo}</strong>
                                    {(leccion.archivos?.length || 0) > 0 && (
                                      <small>{leccion.archivos.length} {leccion.archivos.length === 1 ? "archivo" : "archivos"}</small>
                                    )}
                                  </button>
                                  {vista ? (
                                    <span className="cv-etiqueta-vista"><FaCheck /> Vista</span>
                                  ) : (
                                    <button type="button" className="cv-btn cv-btn-chico cv-btn-suave" onClick={() => setLeccionAbierta(expandida ? null : leccion.id)}>
                                      {expandida ? "Cerrar" : "Abrir"}
                                    </button>
                                  )}
                                </li>

                                {expandida && (
                                  <li className="cv-leccion-contenido">
                                    {leccion.contenido ? <p>{leccion.contenido}</p> : <p className="cv-suave">Esta lección no tiene texto.</p>}

                                    {leccion.archivos?.length > 0 && (
                                      <div className="cv-archivos">
                                        {leccion.archivos.map((archivo, i) => {
                                          const url = urlArchivo(archivo);
                                          if (esImagen(archivo)) return <img key={i} src={url} alt={nombreArchivo(archivo)} className="cv-archivo-img" loading="lazy" />;
                                          if (esVideo(archivo)) return <video key={i} src={url} controls className="cv-archivo-video" />;
                                          return (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="cv-archivo-doc">
                                              {extension(archivo) === "pdf" ? <FaFilePdf /> : <FaFileAlt />} {nombreArchivo(archivo)}
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {!vista && (
                                      <button type="button" className="cv-btn" onClick={() => marcarLeccionVista(leccion.id)} disabled={marcando === leccion.id}>
                                        <FaCheck /> {marcando === leccion.id ? "Guardando..." : "Terminé esta lección"}
                                      </button>
                                    )}
                                  </li>
                                )}

                                {(leccion.examenes || []).map(renderExamen)}
                              </React.Fragment>
                            );
                          })}

                          {(nivel.examenesNivel || [])
                            .filter((e) => !(nivel.lecciones || []).some((l) => (l.examenes || []).some((x) => x.id === e.id)))
                            .map(renderExamen)}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            )
          )}

          {pestana === "material" && (
            material.length === 0 ? (
              <div className="cv-vacio"><FaImages /><p>Este curso no tiene material adicional.</p></div>
            ) : (
              <div className="cv-galeria">
                {(curso.imagenes || []).map((img, i) => (
                  <a key={`i${i}`} href={urlArchivo(img)} target="_blank" rel="noreferrer" className="cv-galeria-item">
                    <img src={/^(https?:|data:)/.test(img) ? img : urlArchivo(img)} alt={`Imagen ${i + 1} del curso`} loading="lazy" />
                  </a>
                ))}
                {(curso.videos || []).map((vid, i) => (
                  <div key={`v${i}`} className="cv-galeria-item cv-galeria-video">
                    <video src={urlArchivo(vid)} controls preload="metadata" />
                    <span><FaVideo /> Video {i + 1}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </main>

        {/* ================= LATERAL ================= */}
        <aside className="cv-lateral">
          {siguiente && (
            <div className="cv-tarjeta cv-siguiente">
              <span className="cv-tarjeta-etiqueta">Tu siguiente paso</span>
              <strong>{siguiente.item.titulo}</strong>
              <small>{siguiente.tipo === "leccion" ? "Lección" : "Examen"} · {siguiente.nivel.titulo}</small>
              {siguiente.tipo === "examen" ? (
                <Link to={`/principal/examen/${siguiente.item.id}`} className="cv-btn"><FaPlay /> Presentar examen</Link>
              ) : (
                <button type="button" className="cv-btn" onClick={() => irA(siguiente)}><FaPlay /> Ir a la lección</button>
              )}
            </div>
          )}

          {terminado && (
            <div className="cv-tarjeta cv-logro">
              <FaTrophy />
              <strong>¡Terminaste el curso!</strong>
              <small>Revisa en Mi progreso qué curso te conviene después.</small>
              <Link to="/principal/analisis-respuestas" className="cv-btn cv-btn-suave">Ver recomendaciones</Link>
            </div>
          )}

          {progreso?.consejos?.length > 0 && (
            <div className="cv-tarjeta">
              <span className="cv-tarjeta-etiqueta"><FaLightbulb /> Consejos para ti</span>
              <ul className="cv-consejos">
                {progreso.consejos.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="cv-tarjeta cv-profesor">
            <span className="cv-avatar">{(progreso?.profesor || curso.profesor || "P").charAt(0).toUpperCase()}</span>
            <div>
              <span className="cv-tarjeta-etiqueta">Tu profesor</span>
              <strong>{progreso?.profesor || curso.profesor || "Profesor"}</strong>
            </div>
            <Link to={`/principal/mensajes?curso=${id}`} className="cv-btn cv-btn-suave cv-btn-ancho"><FaComments /> Enviar mensaje</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Cursos;
