import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Cell,
  ReferenceLine
} from "recharts";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import { API_URL } from "../../config";

const POR_PAGINA = 10;
const MINIMO_APROBATORIO = 70;
const TODOS = "__todos__";

/* ================= AYUDAS ================= */

const aNumero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const redondear = (v) => Math.round(v * 10) / 10;

const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

// Color según la calificación: verde aprobado, ámbar en riesgo, rojo reprobado
const colorCalificacion = (valor) => {
  if (valor >= MINIMO_APROBATORIO) return "#22c55e";
  if (valor >= 50) return "#f59e0b";
  return "#ef4444";
};

const textoNivel = (valor) => {
  if (valor >= MINIMO_APROBATORIO) return "Aprobado";
  if (valor >= 50) return "En riesgo";
  return "Reprobado";
};

// "Examen Nivel 1: Git básico" -> "Git básico" para que quepa en la gráfica
const nombreCortoExamen = (titulo) => {
  const sinPrefijo = String(titulo || "Examen").replace(/^Examen\s+/i, "");
  const partes = sinPrefijo.split(":");
  return (partes.length > 1 ? partes.slice(1).join(":") : sinPrefijo).trim();
};

const claveAlumno = (r) => r.email || r.alumno || "sin-alumno";

function TooltipExamen({ active, payload }) {
  if (!active || !payload?.length) return null;
  const e = payload[0].payload;
  return (
    <div className="rp-tooltip">
      <strong>{e.examen}</strong>
      <span>
        Promedio: <b style={{ color: e.color }}>{e.promedio}%</b> · {textoNivel(e.promedio)}
      </span>
      <span>
        {plural(e.intentos, "resultado", "resultados")} de {plural(e.alumnos, "alumno", "alumnos")}
      </span>
      <span>
        {plural(e.aprobados, "aprobado", "aprobados")} ({MINIMO_APROBATORIO}% o más)
      </span>
    </div>
  );
}

/* ================= COMPONENTE ================= */

function ReportesProfesor() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginas, setPaginas] = useState({}); // { "Nombre del curso": numeroDePagina }

  const [cursoSel, setCursoSel] = useState(TODOS);
  const [alumnoSel, setAlumnoSel] = useState(TODOS);
  const [busqueda, setBusqueda] = useState("");

  const cambiarPagina = (curso, nueva) => setPaginas((prev) => ({ ...prev, [curso]: nueva }));

  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token");

    if (!token) {
      Promise.resolve().then(() => {
        if (!activo) return;
        setError("Sesión expirada. Inicia sesión.");
        setLoading(false);
      });
      return () => {
        activo = false;
      };
    }

    axios
      .get(`${API_URL}/reportes/profesor`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (activo) setReportes(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        if (activo) setError("Error cargando reportes");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  /* ================= OPCIONES DE FILTRO ================= */

  const cursos = useMemo(
    () => [...new Set(reportes.map((r) => r.curso || "Sin curso"))].sort((a, b) => a.localeCompare(b, "es")),
    [reportes]
  );

  // Los alumnos dependen del curso elegido
  const alumnos = useMemo(() => {
    const mapa = new Map();
    reportes
      .filter((r) => cursoSel === TODOS || (r.curso || "Sin curso") === cursoSel)
      .forEach((r) => {
        const clave = claveAlumno(r);
        if (!mapa.has(clave)) mapa.set(clave, { clave, nombre: r.alumno || "Sin nombre", email: r.email || "" });
      });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [reportes, cursoSel]);

  const alumnoActivo = alumnoSel !== TODOS && alumnos.some((a) => a.clave === alumnoSel) ? alumnoSel : TODOS;
  const alumnoInfo = alumnos.find((a) => a.clave === alumnoActivo);

  /* ================= DATOS FILTRADOS ================= */

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return reportes.filter((r) => {
      if (cursoSel !== TODOS && (r.curso || "Sin curso") !== cursoSel) return false;
      if (alumnoActivo !== TODOS && claveAlumno(r) !== alumnoActivo) return false;
      if (texto && !String(r.examen || "").toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [reportes, cursoSel, alumnoActivo, busqueda]);

  const resumen = useMemo(() => {
    const total = filtrados.length;
    const suma = filtrados.reduce((s, r) => s + aNumero(r.calificacion), 0);
    const aprobados = filtrados.filter((r) => aNumero(r.calificacion) >= MINIMO_APROBATORIO).length;
    return {
      total,
      alumnos: new Set(filtrados.map(claveAlumno)).size,
      promedio: total ? redondear(suma / total) : 0,
      aprobados,
      porcentajeAprobados: total ? Math.round((aprobados / total) * 100) : 0
    };
  }, [filtrados]);

  // Promedio por examen calculado con los filtros aplicados
  const porExamen = useMemo(() => {
    const mapa = new Map();
    filtrados.forEach((r) => {
      const examen = r.examen || "Examen";
      if (!mapa.has(examen)) mapa.set(examen, { examen, suma: 0, intentos: 0, aprobados: 0, alumnos: new Set() });
      const e = mapa.get(examen);
      const cal = aNumero(r.calificacion);
      e.suma += cal;
      e.intentos += 1;
      if (cal >= MINIMO_APROBATORIO) e.aprobados += 1;
      e.alumnos.add(claveAlumno(r));
    });
    return [...mapa.values()]
      .map((e) => {
        const promedio = redondear(e.suma / e.intentos);
        return {
          examen: e.examen,
          corto: nombreCortoExamen(e.examen),
          promedio,
          intentos: e.intentos,
          aprobados: e.aprobados,
          alumnos: e.alumnos.size,
          color: colorCalificacion(promedio)
        };
      })
      .sort((a, b) => a.examen.localeCompare(b.examen, "es"));
  }, [filtrados]);

  const examenMasBajo = porExamen.reduce((min, e) => (!min || e.promedio < min.promedio ? e : min), null);

  const reportesPorCurso = useMemo(
    () =>
      filtrados.reduce((acc, r) => {
        const curso = r.curso || "Sin curso";
        if (!acc[curso]) acc[curso] = [];
        acc[curso].push(r);
        return acc;
      }, {}),
    [filtrados]
  );

  const hayFiltros = cursoSel !== TODOS || alumnoActivo !== TODOS || busqueda.trim() !== "";

  const limpiarFiltros = () => {
    setCursoSel(TODOS);
    setAlumnoSel(TODOS);
    setBusqueda("");
    setPaginas({});
  };

  const tituloGrafica = alumnoInfo
    ? `Calificación promedio de ${alumnoInfo.nombre} en cada examen`
    : "Calificación promedio del grupo en cada examen";

  /* ================= RENDER ================= */

  return (
    <div className="container mt-4 rp">
      <h2 className="mb-2">Reportes de Resultados</h2>
      <p className="rp-intro">
        Revisa cómo les fue a tus alumnos en los exámenes. Usa los filtros para ver un curso o un alumno en específico;
        el resumen, la gráfica y las tablas se actualizan solos.
      </p>

      {loading && <p>Cargando reportes...</p>}
      {!loading && error && <p className="text-danger">{error}</p>}
      {!loading && !error && reportes.length === 0 && <p>No hay resultados registrados aún.</p>}

      {!loading && reportes.length > 0 && (
        <>
          {/* ================= FILTROS ================= */}
          <div className="rp-filtros">
            <label className="rp-filtro">
              <span>Curso</span>
              <select
                value={cursoSel}
                onChange={(e) => {
                  setCursoSel(e.target.value);
                  setAlumnoSel(TODOS);
                  setPaginas({});
                }}
              >
                <option value={TODOS}>Todos los cursos ({cursos.length})</option>
                {cursos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="rp-filtro">
              <span>Alumno</span>
              <select
                value={alumnoActivo}
                onChange={(e) => {
                  setAlumnoSel(e.target.value);
                  setPaginas({});
                }}
              >
                <option value={TODOS}>Todos los alumnos ({alumnos.length})</option>
                {alumnos.map((a) => (
                  <option key={a.clave} value={a.clave}>
                    {a.nombre}
                    {a.email ? ` — ${a.email}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="rp-filtro">
              <span>Buscar examen</span>
              <input
                type="search"
                placeholder="Ej. Git básico"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginas({});
                }}
              />
            </label>

            <button type="button" className="custom-btn rp-limpiar" onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
          </div>

          {hayFiltros && (
            <p className="rp-chips">
              Mostrando:
              {cursoSel !== TODOS && <span className="rp-chip">Curso: {cursoSel}</span>}
              {alumnoInfo && <span className="rp-chip">Alumno: {alumnoInfo.nombre}</span>}
              {busqueda.trim() && <span className="rp-chip">Examen: “{busqueda.trim()}”</span>}
            </p>
          )}

          {filtrados.length === 0 ? (
            <p className="rp-vacio">No hay resultados con estos filtros. Prueba con otra combinación.</p>
          ) : (
            <>
              {/* ================= RESUMEN ================= */}
              <div className="pf-stats">
                <div className="pf-stat">
                  <span className="pf-stat-valor">{resumen.total}</span>
                  <span className="pf-stat-etiqueta">Exámenes presentados</span>
                  <span className="pf-stat-ayuda">
                    Por {plural(resumen.alumnos, "alumno", "alumnos")}.
                  </span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-valor" style={{ color: colorCalificacion(resumen.promedio) }}>
                    {resumen.promedio}%
                  </span>
                  <span className="pf-stat-etiqueta">Calificación promedio</span>
                  <span className="pf-stat-ayuda">{textoNivel(resumen.promedio)} en general.</span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-valor">{resumen.porcentajeAprobados}%</span>
                  <span className="pf-stat-etiqueta">Exámenes aprobados</span>
                  <span className="pf-stat-ayuda">
                    {resumen.aprobados} de {resumen.total} con {MINIMO_APROBATORIO}% o más.
                  </span>
                </div>
              </div>

              {/* ================= GRÁFICA ================= */}
              <div className="pf-panel rp-panel">
                <h4>{tituloGrafica}</h4>
                {examenMasBajo && porExamen.length > 1 && (
                  <p className="pf-resumen">
                    El examen con el promedio más bajo es{" "}
                    <strong style={{ color: examenMasBajo.color }}>{examenMasBajo.corto}</strong> (
                    {examenMasBajo.promedio}%).
                  </p>
                )}

                <div className="rp-leyenda">
                  <span><i style={{ background: "#22c55e" }} /> Aprobado ({MINIMO_APROBATORIO}% o más)</span>
                  <span><i style={{ background: "#f59e0b" }} /> En riesgo (50–69%)</span>
                  <span><i style={{ background: "#ef4444" }} /> Reprobado (menos de 50%)</span>
                  <span><i className="rp-linea" /> Mínimo para aprobar</span>
                </div>

                <div className="rp-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porExamen} margin={{ top: 28, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--card-border)" />
                      <XAxis
                        dataKey="corto"
                        interval={0}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }}
                        height={50}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 70, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        label={{
                          value: "Calificación promedio",
                          angle: -90,
                          position: "insideLeft",
                          fill: "currentColor",
                          fontSize: 12,
                          style: { textAnchor: "middle" }
                        }}
                      />
                      <ReferenceLine
                        y={MINIMO_APROBATORIO}
                        stroke="#22c55e"
                        strokeDasharray="6 4"
                        strokeWidth={2}
                      />
                      <Tooltip content={<TooltipExamen />} cursor={{ fill: "rgba(128,128,128,0.12)" }} />
                      <Bar dataKey="promedio" radius={[8, 8, 0, 0]} maxBarSize={72}>
                        {porExamen.map((e) => (
                          <Cell key={e.examen} fill={e.color} style={{ fill: e.color }} />
                        ))}
                        <LabelList
                          dataKey="promedio"
                          content={({ x, y, width, value }) => (
                            <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="currentColor" fontSize={12} fontWeight={700}>
                              {value}%
                            </text>
                          )}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="pf-nota">
                  <strong>¿Cómo leer esta gráfica?</strong> Cada barra es un examen y su altura es la calificación
                  promedio. La línea verde punteada marca el {MINIMO_APROBATORIO}%: las barras que no la alcanzan son
                  exámenes donde los alumnos necesitan más apoyo. Pasa el cursor sobre una barra para ver cuántos alumnos
                  lo presentaron y cuántos aprobaron.
                </p>
              </div>

              {/* ================= TABLAS ================= */}
              <h3 className="mt-5 mb-3">Detalle de resultados</h3>

              {Object.keys(reportesPorCurso).map((curso) => {
                const filas = reportesPorCurso[curso];
                const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
                const paginaActual = Math.min(paginas[curso] || 1, totalPaginas);
                const inicio = (paginaActual - 1) * POR_PAGINA;
                const filasVisibles = filas.slice(inicio, inicio + POR_PAGINA);

                return (
                  <div key={curso} className="mb-5">
                    <h4 className="mt-4 rp-curso">
                      {curso} <span>{plural(filas.length, "resultado", "resultados")}</span>
                    </h4>

                    <div className="table-responsive">
                      <table className="table table-dark table-striped shadow">
                        <thead>
                          <tr>
                            <th>Alumno</th>
                            <th>Email</th>
                            <th>Examen</th>
                            <th>Correctas</th>
                            <th>Calificación</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filasVisibles.map((r, i) => {
                            const cal = aNumero(r.calificacion);
                            return (
                              <tr key={inicio + i}>
                                <td>{r.alumno}</td>
                                <td>{r.email}</td>
                                <td>{r.examen}</td>
                                <td>
                                  {r.correctas} de {r.total}
                                </td>
                                <td>
                                  <span
                                    className="rp-badge"
                                    style={{ color: colorCalificacion(cal), borderColor: colorCalificacion(cal) }}
                                    title={textoNivel(cal)}
                                  >
                                    {redondear(cal)}% · {textoNivel(cal)}
                                  </span>
                                </td>
                                <td className="rp-fecha">{r.fecha}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filas.length > POR_PAGINA && (
                      <div className="reportes-paginacion">
                        <button
                          type="button"
                          className="custom-btn"
                          onClick={() => cambiarPagina(curso, paginaActual - 1)}
                          disabled={paginaActual === 1}
                          aria-label="Página anterior"
                        >
                          ←
                        </button>
                        <span>
                          {inicio + 1}–{Math.min(inicio + POR_PAGINA, filas.length)} de {filas.length}
                        </span>
                        <button
                          type="button"
                          className="custom-btn"
                          onClick={() => cambiarPagina(curso, paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          aria-label="Página siguiente"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ReportesProfesor;
