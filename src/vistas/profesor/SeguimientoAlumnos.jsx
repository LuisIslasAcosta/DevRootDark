import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaExclamationTriangle,
  FaUserClock,
  FaUserGraduate,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaLightbulb,
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
  LabelList,
  Legend
} from "recharts";
import "../styles/ProfesorPanel.css";
import "../styles/ProgresoAcademico.css";
import { API_URL } from "../../config";

const TODOS = "__todos__";

const colorNivel = (valor, aprobatoria = 70) => {
  if (valor === null || valor === undefined) return "#94a3b8";
  if (valor >= 90) return "#16a34a";
  if (valor >= aprobatoria) return "#2563eb";
  if (valor >= 50) return "#d97706";
  return "#dc2626";
};

const recortar = (texto, max = 18) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

const correoPara = (a) => {
  const nombre = a.alumno.nombre.split(" ")[0];
  const asunto = `Seguimiento de tu curso ${a.curso}`;
  const lineas = [`Hola ${nombre},`, ""];
  if (a.motivos.includes("abandono")) lineas.push(`Noté que llevas ${a.dias_inactivo} días sin entrar a ${a.curso}. ¿Todo bien? Si algo te está costando trabajo, con gusto te ayudo.`);
  if (a.motivos.includes("reprobar")) lineas.push(`Revisé tus resultados y me gustaría apoyarte con ${a.examenes_reprobados.slice(0, 2).join(" y ") || "los temas del curso"}. ¿Te parece si agendamos una asesoría breve?`);
  lineas.push("", "Quedo atento.", "");
  return `mailto:${a.alumno.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(lineas.join("\n"))}`;
};

function SeguimientoAlumnos() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursoSel, setCursoSel] = useState(TODOS);
  const [tipoSel, setTipoSel] = useState(TODOS);
  const [busqueda, setBusqueda] = useState("");
  const [atendidos, setAtendidos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("seguimiento_atendidos")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let activo = true;
    axios
      .get(`${API_URL}/progreso/profesor/riesgo`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then((res) => activo && setDatos(res.data))
      .catch((err) => {
        console.error(err);
        if (activo) setError("No se pudo cargar el seguimiento de alumnos.");
      })
      .finally(() => activo && setLoading(false));
    return () => {
      activo = false;
    };
  }, []);

  const marcarAtendido = (clave) => {
    setAtendidos((prev) => {
      const nuevo = { ...prev };
      if (nuevo[clave]) delete nuevo[clave];
      else nuevo[clave] = new Date().toISOString();
      try {
        localStorage.setItem("seguimiento_atendidos", JSON.stringify(nuevo));
      } catch {
        /* sin almacenamiento */
      }
      return nuevo;
    });
  };

  const aprobatoria = datos?.criterios?.calificacion_aprobatoria ?? 70;
  const diasAbandono = datos?.criterios?.dias_abandono ?? 5;
  const alumnos = useMemo(() => datos?.alumnos || [], [datos]);
  const cursos = useMemo(() => datos?.resumen?.cursos || [], [datos]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return alumnos.filter((a) => {
      if (cursoSel !== TODOS && a.curso_id !== cursoSel) return false;
      if (tipoSel !== TODOS && !a.motivos.includes(tipoSel)) return false;
      if (texto && !`${a.alumno.nombre} ${a.alumno.email}`.toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [alumnos, cursoSel, tipoSel, busqueda]);

  const grafica = useMemo(
    () =>
      cursos
        .filter((c) => c.inscritos > 0)
        .map((c) => ({
          curso: c.curso,
          corto: recortar(c.curso),
          inscritos: c.inscritos,
          sinRiesgo: c.inscritos - c.en_riesgo,
          enRiesgo: c.en_riesgo
        })),
    [cursos]
  );

  if (loading) return <div className="mp"><p className="mp-cargando">Cargando seguimiento...</p></div>;
  if (error) return <div className="mp"><p className="mp-error">{error}</p></div>;

  const r = datos.resumen;

  return (
    <div className="mp">
      <header className="mp-hero mp-hero-profesor">
        <div>
          <span className="mp-hero-sub"><FaUserGraduate /> Seguimiento académico</span>
          <h2>Alumnos que necesitan tu apoyo</h2>
          <p>
            Aquí aparecen los alumnos con promedio menor a {aprobatoria}% (riesgo de reprobar) o que llevan más de{" "}
            {diasAbandono} días sin avanzar en tu curso (riesgo de abandono), con lo que te sugerimos hacer con cada uno.
          </p>
        </div>
      </header>

      <section className="mp-resumen">
        <div className="mp-tarjeta">
          <FaExclamationTriangle className={`mp-tarjeta-icono ${r.alumnos_en_riesgo ? "mp-c-peligro" : "mp-c-suave"}`} />
          <span className="mp-tarjeta-valor">{r.alumnos_en_riesgo}</span>
          <span className="mp-tarjeta-titulo">Alumnos en riesgo</span>
        </div>
        <div className="mp-tarjeta">
          <FaUserGraduate className="mp-tarjeta-icono mp-c-peligro" />
          <span className="mp-tarjeta-valor">{r.riesgo_reprobar}</span>
          <span className="mp-tarjeta-titulo">Riesgo de reprobar</span>
          <span className="mp-tarjeta-ayuda">Promedio menor a {aprobatoria}%</span>
        </div>
        <div className="mp-tarjeta">
          <FaUserClock className="mp-tarjeta-icono mp-c-alerta" />
          <span className="mp-tarjeta-valor">{r.riesgo_abandono}</span>
          <span className="mp-tarjeta-titulo">Riesgo de abandono</span>
          <span className="mp-tarjeta-ayuda">Más de {diasAbandono} días sin avanzar</span>
        </div>
      </section>

      {grafica.length > 0 && (
        <section className="mp-panel">
          <div className="mp-panel-cabecera">
            <h3>Alumnos en riesgo por curso</h3>
            <p>Cada barra es un curso: la parte azul son los alumnos que van bien y la roja los que están en riesgo.</p>
          </div>
          <div className="mp-grafica" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafica} margin={{ top: 24, right: 12, left: -10, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="corto" interval={0} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(128,128,128,0.10)" }}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--ink)" }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.curso}
                />
                <Legend verticalAlign="top" align="right" height={30} />
                <Bar dataKey="sinRiesgo" name="Van bien" stackId="a" fill="#93c5fd" style={{ fill: "#93c5fd" }} maxBarSize={56} />
                <Bar dataKey="enRiesgo" name="En riesgo" stackId="a" fill="#ef4444" style={{ fill: "#ef4444" }} radius={[6, 6, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="inscritos" position="top" formatter={(v) => `${v} inscritos`} fill="currentColor" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ================= FILTROS ================= */}
      <div className="mp-filtros-prof">
        <label>
          <span>Curso</span>
          <select value={cursoSel} onChange={(e) => setCursoSel(e.target.value)}>
            <option value={TODOS}>Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c.curso_id} value={c.curso_id}>{c.curso} ({c.en_riesgo} en riesgo)</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo de riesgo</span>
          <select value={tipoSel} onChange={(e) => setTipoSel(e.target.value)}>
            <option value={TODOS}>Todos</option>
            <option value="reprobar">Riesgo de reprobar</option>
            <option value="abandono">Riesgo de abandono</option>
          </select>
        </label>
        <label>
          <span>Buscar alumno</span>
          <input type="search" placeholder="Nombre o correo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
      </div>

      {/* ================= LISTA ================= */}
      {alumnos.length === 0 ? (
        <div className="mp-vacio mp-vacio-ok">
          <FaCheckCircle />
          <p>¡Buenas noticias! Ningún alumno está en riesgo en este momento.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="mp-vacio"><p>No hay alumnos con estos filtros.</p></div>
      ) : (
        <div className="mp-alumnos">
          {filtrados.map((a) => {
            const clave = `${a.alumno.id}-${a.curso_id}`;
            const atendido = Boolean(atendidos[clave]);
            return (
              <article key={clave} className={`mp-alumno mp-gravedad-${a.gravedad}${atendido ? " mp-atendido" : ""}`}>
                <header className="mp-alumno-cabecera">
                  <div className="mp-avatar">{a.alumno.nombre.charAt(0).toUpperCase()}</div>
                  <div className="mp-alumno-nombre">
                    <h4>{a.alumno.nombre}</h4>
                    <span>{a.alumno.email}</span>
                  </div>
                  <span className={`mp-etiqueta ${a.gravedad === "alta" ? "mp-peligro" : "mp-alerta"}`}>
                    Prioridad {a.gravedad}
                  </span>
                </header>

                <p className="mp-alumno-curso">{a.curso}</p>

                <div className="mp-etiquetas">
                  {a.motivos.includes("reprobar") && (
                    <span className="mp-etiqueta mp-peligro"><FaExclamationTriangle /> Riesgo de reprobar</span>
                  )}
                  {a.motivos.includes("abandono") && (
                    <span className="mp-etiqueta mp-alerta"><FaClock /> {a.dias_inactivo} días sin avanzar</span>
                  )}
                </div>

                <div className="mp-dato-mini">
                  <div>
                    <span>Avance</span>
                    <strong>{Math.round(a.progreso)}%</strong>
                  </div>
                  <div>
                    <span>Promedio</span>
                    <strong style={{ color: colorNivel(a.promedio, aprobatoria) }}>{a.promedio !== null ? `${a.promedio}%` : "—"}</strong>
                  </div>
                  <div>
                    <span>Nivel</span>
                    <strong style={{ color: colorNivel(a.promedio, aprobatoria) }}>{a.nivel}</strong>
                  </div>
                </div>

                {a.examenes_reprobados.length > 0 && (
                  <p className="mp-suave">No aprobados: {a.examenes_reprobados.join(", ")}</p>
                )}

                <div className="mp-consejos">
                  <h4><FaLightbulb /> Qué te recomendamos hacer</h4>
                  <ol>
                    {a.recomendaciones.map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </div>

                <footer className="mp-alumno-acciones">
                  <Link className="mp-btn" to={`/profesor/mensajes?curso=${a.curso_id}&usuario=${a.alumno.id}`}>
                    <FaComments /> Abrir chat
                  </Link>
                  {a.alumno.email && (
                    <a className="mp-btn mp-btn-secundario" href={correoPara(a)}>
                      <FaEnvelope /> Escribirle
                    </a>
                  )}
                  <button type="button" className="mp-btn mp-btn-secundario" onClick={() => marcarAtendido(clave)}>
                    <FaCheckCircle /> {atendido ? "Atendido" : "Marcar como atendido"}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SeguimientoAlumnos;
