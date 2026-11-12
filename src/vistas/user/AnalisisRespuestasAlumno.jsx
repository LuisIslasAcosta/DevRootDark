import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaChartLine,
  FaBookOpen,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaTrophy,
  FaClock,
  FaLightbulb,
  FaArrowRight,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaBrain,
  FaComments
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine
} from "recharts";
import "../styles/EstilosAlumno.css";
import "../styles/ProgresoAcademico.css";
import { API_URL, urlArchivo } from "../../config";

const TODOS = "__todos__";

/* ================= AYUDAS ================= */

const colorNivel = (valor, aprobatoria = 70) => {
  if (valor === null || valor === undefined) return "#94a3b8";
  if (valor >= 90) return "#16a34a";
  if (valor >= aprobatoria) return "#2563eb";
  if (valor >= 50) return "#d97706";
  return "#dc2626";
};

const urlImagen = (img) => {
  if (!img) return null;
  return /^https?:\/\//.test(img) || img.startsWith("data:") ? img : urlArchivo(img);
};

const nombreCorto = (titulo) => {
  const sinPrefijo = String(titulo || "Examen").replace(/^Examen\s+/i, "");
  const partes = sinPrefijo.split(":");
  return (partes.length > 1 ? partes.slice(1).join(":") : sinPrefijo).trim();
};

const recortar = (texto, max = 18) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

const textoInactividad = (dias) => {
  if (dias === null || dias === undefined) return "Sin actividad registrada";
  if (dias === 0) return "Activo hoy";
  if (dias === 1) return "Activo ayer";
  return `Hace ${dias} días`;
};

function Anillo({ valor, color, tamano = 92, grosor = 10, children }) {
  const radio = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * radio;
  const lleno = Math.max(0, Math.min(100, valor || 0));
  return (
    <div className="mp-anillo" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} strokeWidth={grosor} className="mp-anillo-fondo" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          strokeWidth={grosor}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - lleno / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          fill="none"
        />
      </svg>
      <div className="mp-anillo-centro">{children}</div>
    </div>
  );
}

function BarraProgreso({ valor, color }) {
  return (
    <div className="mp-barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <div className="mp-barra-relleno" style={{ width: `${Math.min(100, valor)}%`, background: color }} />
    </div>
  );
}

function EstadoCurso({ curso }) {
  const etiquetas = [];
  if (curso.terminado_aprobado) etiquetas.push(<span key="t" className="mp-etiqueta mp-ok"><FaTrophy /> Terminado</span>);
  else if (curso.terminado) etiquetas.push(<span key="t2" className="mp-etiqueta mp-alerta">Terminado sin aprobar</span>);
  if (curso.riesgo_reprobar === "alto" || curso.riesgo_reprobar === "medio")
    etiquetas.push(<span key="r" className="mp-etiqueta mp-peligro"><FaExclamationTriangle /> Riesgo de reprobar</span>);
  if (curso.riesgo_abandono)
    etiquetas.push(<span key="a" className="mp-etiqueta mp-alerta"><FaClock /> {curso.dias_inactivo} días sin avanzar</span>);
  if (!etiquetas.length) etiquetas.push(<span key="b" className="mp-etiqueta mp-info">Vas bien</span>);
  return <div className="mp-etiquetas">{etiquetas}</div>;
}

function TooltipCursos({ active, payload }) {
  if (!active || !payload?.length) return null;
  const c = payload[0].payload;
  return (
    <div className="mp-tooltip">
      <strong>{c.curso}</strong>
      <span>Avance: <b>{c.progreso}%</b></span>
      <span>Promedio: <b style={{ color: c.color }}>{c.promedio !== null ? `${c.promedio}% · ${c.nivel}` : "Sin exámenes"}</b></span>
    </div>
  );
}

function TooltipExamen({ active, payload }) {
  if (!active || !payload?.length) return null;
  const e = payload[0].payload;
  return (
    <div className="mp-tooltip">
      <strong>{e.titulo}</strong>
      {e.calificacion === null ? (
        <span>Aún no lo presentas</span>
      ) : (
        <>
          <span>Mejor calificación: <b style={{ color: e.color }}>{e.calificacion}%</b></span>
          <span>{e.intentos} {e.intentos === 1 ? "intento" : "intentos"} · {e.aprobado ? "Aprobado" : "No aprobado"}</span>
        </>
      )}
    </div>
  );
}

/* ================= COMPONENTE ================= */

function AnalisisRespuestasAlumno() {
  const [datos, setDatos] = useState(null);
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursoSel, setCursoSel] = useState(TODOS);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API_URL}/progreso/alumno`, { headers })
      .then((res) => activo && setDatos(res.data))
      .catch((err) => {
        console.error(err);
        if (activo) setError("No se pudo cargar tu progreso. Intenta de nuevo en unos minutos.");
      })
      .finally(() => activo && setLoading(false));

    // Predicción del modelo existente (opcional)
    if (usuario.id) {
      axios
        .get(`${API_URL}/respuestas/analisis/${usuario.id}`, { headers })
        .then((res) => activo && setPrediccion(res.data))
        .catch(() => {});
    }

    return () => {
      activo = false;
    };
  }, [usuario.id]);

  const resumen = datos?.resumen;
  const cursos = useMemo(() => datos?.cursos || [], [datos]);
  const aprobatoria = resumen?.calificacion_aprobatoria ?? 70;

  const datosGrafica = useMemo(
    () =>
      cursos.map((c) => ({
        curso: c.curso,
        corto: recortar(c.curso),
        progreso: c.progreso,
        promedio: c.promedio,
        promedioBarra: c.promedio ?? 0,
        nivel: c.nivel,
        color: colorNivel(c.promedio, aprobatoria)
      })),
    [cursos, aprobatoria]
  );

  const cursosVisibles = cursoSel === TODOS ? cursos : cursos.filter((c) => c.curso_id === cursoSel);
  const enRiesgo = cursos.filter((c) => c.en_riesgo);

  if (loading) return <div className="mp"><p className="mp-cargando">Cargando tu progreso...</p></div>;
  if (error) return <div className="mp"><p className="mp-error">{error}</p></div>;

  return (
    <div className="mp">
      {/* ================= ENCABEZADO ================= */}
      <header className="mp-hero">
        <div>
          <span className="mp-hero-sub"><FaGraduationCap /> Mi expediente académico</span>
          <h2>Hola{usuario.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}, este es tu progreso</h2>
          <p>
            Aquí ves cuánto llevas de cada curso, cómo van tus calificaciones y qué te conviene hacer después.
            Para aprobar necesitas {aprobatoria}% o más.
          </p>
        </div>
        {resumen && (
          <div className="mp-hero-nivel" style={{ borderColor: colorNivel(resumen.promedio_general, aprobatoria) }}>
            <span>Tu nivel general</span>
            <strong style={{ color: colorNivel(resumen.promedio_general, aprobatoria) }}>{resumen.nivel_general}</strong>
          </div>
        )}
      </header>

      {cursos.length === 0 ? (
        <div className="mp-vacio">
          <FaBookOpen />
          <p>Aún no estás inscrito en ningún curso. Explora el catálogo en <Link to="/principal">Inicio</Link> para empezar.</p>
        </div>
      ) : (
        <>
          {/* ================= ALERTA DE RIESGO ================= */}
          {enRiesgo.length > 0 && (
            <div className="mp-alerta-riesgo" role="alert">
              <FaExclamationTriangle className="mp-alerta-icono" />
              <div>
                <strong>
                  {enRiesgo.length === 1 ? "Tienes 1 curso que necesita atención" : `Tienes ${enRiesgo.length} cursos que necesitan atención`}
                </strong>
                <ul>
                  {enRiesgo.map((c) => (
                    <li key={c.curso_id}>
                      <button type="button" onClick={() => setCursoSel(c.curso_id)}>{c.curso}</button>
                      {(c.riesgo_reprobar === "alto" || c.riesgo_reprobar === "medio") && ` — promedio de ${c.promedio}%, riesgo de reprobar`}
                      {c.riesgo_abandono && ` — ${c.dias_inactivo} días sin avanzar`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ================= RESUMEN ================= */}
          <section className="mp-resumen">
            <div className="mp-tarjeta mp-tarjeta-anillo">
              <Anillo valor={resumen.progreso_general} color="var(--accent)">
                <strong>{Math.round(resumen.progreso_general)}%</strong>
              </Anillo>
              <div>
                <span className="mp-tarjeta-titulo">Avance general</span>
                <span className="mp-tarjeta-ayuda">Promedio del avance de tus {resumen.cursos} cursos.</span>
              </div>
            </div>
            <div className="mp-tarjeta mp-tarjeta-anillo">
              <Anillo valor={resumen.promedio_general ?? 0} color={colorNivel(resumen.promedio_general, aprobatoria)}>
                <strong>{resumen.promedio_general ?? "—"}{resumen.promedio_general !== null && "%"}</strong>
              </Anillo>
              <div>
                <span className="mp-tarjeta-titulo">Promedio general</span>
                <span className="mp-tarjeta-ayuda">Nivel: {resumen.nivel_general}</span>
              </div>
            </div>
            <div className="mp-tarjeta">
              <FaTrophy className="mp-tarjeta-icono mp-c-ok" />
              <span className="mp-tarjeta-valor">{resumen.terminados}<small> / {resumen.cursos}</small></span>
              <span className="mp-tarjeta-titulo">Cursos terminados</span>
            </div>
            <div className="mp-tarjeta">
              <FaExclamationTriangle className={`mp-tarjeta-icono ${resumen.en_riesgo ? "mp-c-peligro" : "mp-c-suave"}`} />
              <span className="mp-tarjeta-valor">{resumen.en_riesgo}</span>
              <span className="mp-tarjeta-titulo">Cursos en riesgo</span>
            </div>
          </section>

          {/* ================= GRÁFICA GENERAL ================= */}
          <section className="mp-panel">
            <div className="mp-panel-cabecera">
              <h3><FaChartLine /> Todos mis cursos</h3>
              <p>Por cada curso ves dos barras: la azul clara es cuánto llevas y la de color es tu promedio.</p>
            </div>
            <div className="mp-leyenda">
              <span><i style={{ background: "#93c5fd" }} /> Avance del curso</span>
              <span><i style={{ background: "#16a34a" }} /> Promedio excelente (90%+)</span>
              <span><i style={{ background: "#2563eb" }} /> Aprobado</span>
              <span><i style={{ background: "#d97706" }} /> En riesgo</span>
              <span><i style={{ background: "#dc2626" }} /> Reprobado</span>
              <span><i className="mp-linea" /> Mínimo para aprobar ({aprobatoria}%)</span>
            </div>
            <div className="mp-grafica" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafica} margin={{ top: 24, right: 12, left: 0, bottom: 8 }} barGap={6}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="corto" interval={0} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, aprobatoria, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                  <ReferenceLine y={aprobatoria} stroke="#16a34a" strokeDasharray="6 4" strokeWidth={2} />
                  <Tooltip content={<TooltipCursos />} cursor={{ fill: "rgba(128,128,128,0.10)" }} />
                  <Bar dataKey="progreso" name="Avance" fill="#93c5fd" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    <LabelList dataKey="progreso" position="top" formatter={(v) => `${Math.round(v)}%`} fill="currentColor" fontSize={11} />
                  </Bar>
                  <Bar dataKey="promedioBarra" name="Promedio" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {datosGrafica.map((d) => (
                      <Cell key={d.curso} fill={d.color} style={{ fill: d.color }} />
                    ))}
                    <LabelList
                      dataKey="promedio"
                      position="top"
                      formatter={(v) => (v === null || v === undefined ? "—" : `${Math.round(v)}%`)}
                      fill="currentColor"
                      fontSize={11}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ================= FILTRO ================= */}
          <div className="mp-filtro" role="tablist" aria-label="Filtrar por curso">
            <button type="button" className={cursoSel === TODOS ? "activo" : ""} onClick={() => setCursoSel(TODOS)}>
              Todos <span>{cursos.length}</span>
            </button>
            {cursos.map((c) => (
              <button
                type="button"
                key={c.curso_id}
                className={cursoSel === c.curso_id ? "activo" : ""}
                onClick={() => setCursoSel(c.curso_id)}
              >
                <i style={{ background: c.en_riesgo ? "#dc2626" : c.terminado ? "#16a34a" : "#2563eb" }} />
                {c.curso}
              </button>
            ))}
          </div>

          {/* ================= DETALLE POR CURSO ================= */}
          <div className="mp-cursos">
            {cursosVisibles.map((c) => {
              const examenes = c.calificaciones.map((e) => ({
                ...e,
                corto: recortar(nombreCorto(e.titulo), 16),
                valor: e.calificacion ?? 0,
                etiqueta: e.calificacion === null ? "Pendiente" : `${Math.round(e.calificacion)}%`,
                color: e.calificacion === null ? "#cbd5e1" : colorNivel(e.calificacion, aprobatoria)
              }));
              const img = urlImagen(c.imagen);
              return (
                <article key={c.curso_id} className={`mp-curso${c.en_riesgo ? " mp-curso-riesgo" : ""}`}>
                  <header className="mp-curso-cabecera">
                    {img ? <img src={img} alt="" className="mp-curso-img" /> : <div className="mp-curso-img mp-curso-img-vacia"><FaBookOpen /></div>}
                    <div className="mp-curso-titulo">
                      <h3>{c.curso}</h3>
                      {c.profesor && <span><FaChalkboardTeacher /> {c.profesor}</span>}
                      <EstadoCurso curso={c} />
                    </div>
                    <div className="mp-curso-botones">
                      <Link to={`/principal/mensajes?curso=${c.curso_id}`} className="mp-btn mp-btn-secundario" title="Escribir a tu profesor">
                        <FaComments /> {c.en_riesgo ? "Pedir ayuda" : "Escribir al profesor"}
                      </Link>
                      <Link to={`/principal/cursos/${c.curso_id}`} className="mp-btn">
                        {c.terminado ? "Ver curso" : "Continuar"} <FaArrowRight />
                      </Link>
                    </div>
                  </header>

                  <div className="mp-curso-cuerpo">
                    <div className="mp-curso-datos">
                      <div className="mp-dato">
                        <div className="mp-dato-fila"><span><FaBookOpen /> Lecciones</span><b>{c.lecciones_vistas} / {c.total_lecciones}</b></div>
                        <BarraProgreso valor={c.total_lecciones ? (c.lecciones_vistas / c.total_lecciones) * 100 : 0} color="#60a5fa" />
                      </div>
                      <div className="mp-dato">
                        <div className="mp-dato-fila"><span><FaClipboardCheck /> Exámenes</span><b>{c.examenes_presentados} / {c.total_examenes}</b></div>
                        <BarraProgreso valor={c.total_examenes ? (c.examenes_presentados / c.total_examenes) * 100 : 0} color="#818cf8" />
                      </div>
                      <div className="mp-dato-mini">
                        <div>
                          <span>Avance</span>
                          <strong>{Math.round(c.progreso)}%</strong>
                        </div>
                        <div>
                          <span>Promedio</span>
                          <strong style={{ color: colorNivel(c.promedio, aprobatoria) }}>{c.promedio !== null ? `${c.promedio}%` : "—"}</strong>
                        </div>
                        <div>
                          <span>Nivel</span>
                          <strong style={{ color: colorNivel(c.promedio, aprobatoria) }}>{c.nivel}</strong>
                        </div>
                      </div>
                      <p className="mp-actividad"><FaClock /> Última actividad: {textoInactividad(c.dias_inactivo)}</p>
                    </div>

                    <div className="mp-curso-grafica">
                      <h4>Calificación en cada examen</h4>
                      {examenes.length === 0 ? (
                        <p className="mp-suave">Este curso aún no tiene exámenes.</p>
                      ) : (
                        <div style={{ height: 210 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={examenes} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
                              <CartesianGrid vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="corto" interval={0} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
                              <YAxis domain={[0, 100]} ticks={[0, 50, aprobatoria, 100]} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
                              <ReferenceLine y={aprobatoria} stroke="#16a34a" strokeDasharray="5 4" />
                              <Tooltip content={<TooltipExamen />} cursor={{ fill: "rgba(128,128,128,0.10)" }} />
                              <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={40} minPointSize={3}>
                                {examenes.map((e) => (
                                  <Cell key={e.examen_id} fill={e.color} style={{ fill: e.color }} />
                                ))}
                                <LabelList
                                  dataKey="etiqueta"
                                  position="top"
                                  fill="currentColor"
                                  fontSize={11}
                                  fontWeight={700}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.consejos?.length > 0 && (
                    <div className="mp-consejos">
                      <h4><FaLightbulb /> Qué te recomendamos</h4>
                      <ul>
                        {c.consejos.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* ================= CURSOS RECOMENDADOS ================= */}
          {datos.recomendados?.length > 0 && (
            <section className="mp-panel">
              <div className="mp-panel-cabecera">
                <h3><FaGraduationCap /> Tu siguiente paso</h3>
                <p>
                  {datos.recomendados[0].motivo === "terminado"
                    ? "Cursos elegidos según lo que ya terminaste."
                    : "Cuando termines tus cursos actuales, estos son los que más te conviene tomar."}
                </p>
              </div>
              <div className="mp-recomendados">
                {datos.recomendados.map((r) => {
                  const img = urlImagen(r.imagen);
                  return (
                    <article key={r.curso_id} className="mp-recomendado">
                      {img ? <img src={img} alt="" /> : <div className="mp-recomendado-img"><FaGraduationCap /></div>}
                      <div className="mp-recomendado-cuerpo">
                        <span className="mp-etiqueta mp-info">{r.tema}</span>
                        <h4>{r.nombre}</h4>
                        <p className="mp-razon">{r.razon}</p>
                        <span className="mp-suave">Porque {r.motivo === "terminado" ? "terminaste" : "estás cursando"} «{r.basado_en}»</span>
                        <Link to={`/principal#curso-${r.curso_id}`} className="mp-btn mp-btn-secundario">
                          Ver e inscribirme <FaArrowRight />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= PREDICCIÓN (modelo existente) ================= */}
          {prediccion?.prediccion_calificacion !== undefined && (
            <section className="mp-panel mp-prediccion">
              <FaBrain className="mp-tarjeta-icono mp-c-info" />
              <div>
                <h3>Predicción de tu próxima calificación</h3>
                <p>
                  Con tu historial, tu siguiente examen podría salir alrededor de <strong>{prediccion.prediccion_calificacion}</strong>
                  {prediccion.nivel_futuro ? <> (nivel <strong>{prediccion.nivel_futuro}</strong>)</> : null}.
                  Es una estimación: estudiar antes del examen puede mejorarla.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default AnalisisRespuestasAlumno;
