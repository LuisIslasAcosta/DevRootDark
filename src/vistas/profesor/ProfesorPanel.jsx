import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaClipboardList,
  FaChartBar,
  FaUserEdit,
  FaPen,
  FaUsers,
  FaLayerGroup,
  FaListUl,
  FaMoneyCheckAlt,
  FaUserGraduate,
  FaComments
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from "recharts";

import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import "../../temas/temas.css";
import "../../componentes/pagos.css";
import { API_URL } from "../../config";
import Logo from "../../componentes/Logo";
import { obtenerPagosProfesor } from "../../componentes/pagos";

const API = API_URL;
const CUSTOM_VARS = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];

const COLORES_GRUPO = ["#22c55e", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6", "#0ea5e9"];

const formatoMoneda = (valor) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(valor);

const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

// Traduce el silhouette score a palabras que cualquier persona entienda
const interpretarSilhouette = (valor) => {
  if (typeof valor !== "number" || Number.isNaN(valor)) return { texto: "Sin dato", detalle: "" };
  if (valor >= 0.7) return { texto: "Muy claros", detalle: "Los cursos de cada grupo se parecen mucho entre sí." };
  if (valor >= 0.5) return { texto: "Claros", detalle: "Los grupos están bien separados unos de otros." };
  if (valor >= 0.25) return { texto: "Aceptables", detalle: "Los grupos se distinguen, aunque algunos cursos quedan cerca de otro grupo." };
  return { texto: "Poco claros", detalle: "Los cursos se parecen mucho entre grupos; conviene tomarlos con cautela." };
};

// Nombre corto según la posición del grupo (de menor a mayor)
const nombrePorPosicion = (indice, total, bajo, medio, alto) => {
  if (total === 1) return medio;
  if (indice === 0) return bajo;
  if (indice === total - 1) return alto;
  return total === 3 ? medio : `${medio} ${indice}`;
};

// Convierte la respuesta del KMeans en grupos con nombre y descripción en lenguaje común
const construirGrupos = (distribucion, centroides, totalCursos) => {
  const base = distribucion.map((d) => {
    const centro = centroides?.[d.cluster] || [];
    return {
      cluster: d.cluster,
      count: Number(d.count) || 0,
      precio: Number(centro[0]),
      videos: Number(centro[1])
    };
  });

  const precios = base.map((g) => g.precio).filter(Number.isFinite);
  const diferenciaPrecio = precios.length ? Math.max(...precios) - Math.min(...precios) : 0;
  // Si todos cuestan casi lo mismo, la diferencia entre grupos está en la cantidad de videos
  const porPrecio = diferenciaPrecio >= 1;

  const ordenados = [...base].sort((a, b) =>
    porPrecio ? (a.precio || 0) - (b.precio || 0) : (a.videos || 0) - (b.videos || 0)
  );

  return ordenados.map((g, i) => {
    const etiqueta = porPrecio
      ? nombrePorPosicion(i, ordenados.length, "Precio bajo", "Precio medio", "Precio alto")
      : nombrePorPosicion(i, ordenados.length, "Pocos videos", "Videos intermedios", "Muchos videos");
    const porcentaje = totalCursos > 0 ? (g.count / totalCursos) * 100 : 0;
    const videosRedondeados = Number.isFinite(g.videos) ? Math.round(g.videos) : null;
    const precioTexto = Number.isFinite(g.precio) ? (g.precio <= 0 ? "gratis" : formatoMoneda(g.precio)) : "-";
    const videosTexto = videosRedondeados === null ? "-" : plural(videosRedondeados, "video", "videos");

    return {
      ...g,
      etiqueta,
      color: COLORES_GRUPO[i % COLORES_GRUPO.length],
      porcentaje,
      precioTexto,
      videosTexto,
      descripcion:
        Number.isFinite(g.precio) && videosRedondeados !== null
          ? `En promedio cuestan ${precioTexto} y tienen alrededor de ${videosTexto}.`
          : "",
      etiquetaBarra: `${plural(g.count, "curso", "cursos")} (${porcentaje.toFixed(0)}%)`
    };
  });
};

function TooltipGrupo({ active, payload }) {
  if (!active || !payload?.length) return null;
  const g = payload[0].payload;
  return (
    <div className="pf-tooltip">
      <strong style={{ color: g.color }}>{g.etiqueta}</strong>
      <span>{plural(g.count, "curso", "cursos")} · {g.porcentaje.toFixed(0)}% del total</span>
      {g.descripcion && <span>{g.descripcion}</span>}
    </div>
  );
}

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= USER =================
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });
  const [fotoError, setFotoError] = useState(false);

  // ================= PAGOS POR VALIDAR (contador del menú) =================
  const [pagosPorValidar, setPagosPorValidar] = useState(0);
  useEffect(() => {
    obtenerPagosProfesor("en_revision")
      .then(res => setPagosPorValidar(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setPagosPorValidar(0));
  }, [location.pathname]);

  // ================= THEME =================
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  // ================= DATA =================
  const [cursos, setCursos] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState(false);

  // ================= KMEANS =================
  const [kmeansData, setKmeansData] = useState(null);
  const [loadingKmeans, setLoadingKmeans] = useState(false);
  const [errorKmeans, setErrorKmeans] = useState(null);

  // ================= SYNC USER =================
  useEffect(() => {
    const syncUser = () => {
      const updated = localStorage.getItem("usuario");
      if (updated) {
        setUser(JSON.parse(updated));
        setFotoError(false);
      }
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // ================= APPLY THEME =================
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    CUSTOM_VARS.forEach((v) => {
      const saved = localStorage.getItem(v);
      if (saved) document.documentElement.style.setProperty(v, saved);
    });
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    CUSTOM_VARS.forEach((v) => {
      document.documentElement.style.removeProperty(v);
      localStorage.removeItem(v);
    });
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  // ================= LOAD COURSES =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API}/mis_cursos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCursos(res.data || []))
      .catch((err) => {
        console.error("Error cursos:", err);
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setErrorCursos(true);
      })
      .finally(() => setCargandoCursos(false));
  }, [navigate]);

  // ================= LOAD KMEANS =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingKmeans(true);
    axios
      .get(`${API}/kmeans`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setKmeansData(res.data))
      .catch((err) => {
        console.error("Error KMeans:", err);
        setErrorKmeans("No se pudo cargar el análisis KMeans. Revisa que el servidor esté activo.");
      })
      .finally(() => setLoadingKmeans(false));
  }, []);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ================= DERIVED =================
  const enInicio = location.pathname.replace(/\/$/, "") === "/profesor";

  const foto = user?.foto_perfil
    ? /^(data:image|https?:)/.test(user.foto_perfil)
      ? user.foto_perfil
      : `data:image/png;base64,${user.foto_perfil}`
    : null;
  const nombre = user?.nombre || "Profesor";
  const inicial = nombre.trim().charAt(0).toUpperCase();

  const distribucion = useMemo(() => kmeansData?.distribucion || [], [kmeansData]);
  const totalRegistros = useMemo(
    () => distribucion.reduce((suma, d) => suma + (Number(d.count) || 0), 0),
    [distribucion]
  );
  const silhouetteNum = typeof kmeansData?.silhouette === "number" ? kmeansData.silhouette : null;
  const silhouette = silhouetteNum !== null ? silhouetteNum.toFixed(2) : kmeansData?.silhouette;
  const lecturaSilhouette = interpretarSilhouette(silhouetteNum);
  const grupos = useMemo(
    () => construirGrupos(distribucion, kmeansData?.centroides, totalRegistros),
    [distribucion, kmeansData, totalRegistros]
  );
  const maxCursos = grupos.reduce((max, g) => Math.max(max, g.count), 0);
  const gruposMayores = grupos.filter((g) => g.count === maxCursos && maxCursos > 0);

  const navClass = ({ isActive }) => `pf-link${isActive ? " active" : ""}`;

  return (
    <div className="pf-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="pf-sidebar">
        <div className="pf-brand">
          <Logo variante="nav" alto="40px" className="sidebar-logo" />
          <span className="brand-texto">Panel del Profesor</span>
        </div>

        <div className="pf-perfil">
          {foto && !fotoError ? (
            <img src={foto} alt="Foto de perfil" className="pf-avatar" referrerPolicy="no-referrer" onError={() => setFotoError(true)} />
          ) : (
            <div className="pf-avatar pf-avatar--inicial" aria-hidden="true">
              {inicial}
            </div>
          )}
          <div className="pf-perfil-info">
            <span className="pf-perfil-nombre">{nombre}</span>
            <span className="pf-perfil-rol">Profesor</span>
          </div>
        </div>

        <nav className="pf-nav">
          <NavLink to="/profesor" end className={navClass}>
            <FaHome /> Inicio
          </NavLink>
          <NavLink to="/profesor/cursos" className={navClass}>
            <FaBookOpen /> Cursos
          </NavLink>
          <NavLink to="/profesor/pagos" className={navClass}>
            <FaMoneyCheckAlt /> Pagos
            {pagosPorValidar > 0 && <span className="pago-badge-nav">{pagosPorValidar}</span>}
          </NavLink>
          <NavLink to="/profesor/examenes" className={navClass}>
            <FaClipboardList /> Exámenes
          </NavLink>
          <NavLink to="/profesor/reportes" className={navClass}>
            <FaChartBar /> Reportes
          </NavLink>
          <NavLink to="/profesor/seguimiento" className={navClass}>
            <FaUserGraduate /> Seguimiento
          </NavLink>
          <NavLink to="/profesor/mensajes" className={navClass}>
            <FaComments /> Mensajes
          </NavLink>
        </nav>

        <div className="pf-acciones-lado">
          <button type="button" className="pf-btn-lado" onClick={() => navigate("/profesor/editar-perfil")}>
            <FaUserEdit /> Editar perfil
          </button>
          <button type="button" className="pf-btn-lado pf-btn-lado--salir" onClick={handleLogout}>
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="pf-main">
        {/* ================= TOPBAR ================= */}
        <header className="pf-topbar">
          <div>
            <h2>Hola, {nombre}</h2>
            <p>Administra tus cursos, alumnos, exámenes y lecciones.</p>
          </div>

          <div className="pf-tema">
            <button
              type="button"
              className="pf-tema-toggle"
              onClick={() => setShowCustomizer(!showCustomizer)}
              aria-label="Personalizar tema"
              aria-expanded={showCustomizer}
            >
              <FaPalette size={18} />
            </button>
            {showCustomizer && (
              <div className="pf-tema-menu">
                <h4>Tema</h4>
                <div className="pf-tema-opciones">
                  <button type="button" className={theme === "light" ? "sel" : ""} onClick={() => changeTheme("light")}>Claro</button>
                  <button type="button" className={theme === "dark" ? "sel" : ""} onClick={() => changeTheme("dark")}>Oscuro</button>
                  <button type="button" className={theme === "blue" ? "sel" : ""} onClick={() => changeTheme("blue")}>Azul</button>
                  <button type="button" className={theme === "green" ? "sel" : ""} onClick={() => changeTheme("green")}>Verde</button>
                </div>
                <h4>Personalizar</h4>
                <label>Fondo <input type="color" name="--bg-color" onChange={handleCustomTheme} /></label>
                <label>Texto <input type="color" name="--text-color" onChange={handleCustomTheme} /></label>
                <label>Tarjeta <input type="color" name="--card-bg" onChange={handleCustomTheme} /></label>
                <label>Borde <input type="color" name="--card-border" onChange={handleCustomTheme} /></label>
                <label>Enlaces <input type="color" name="--link-color" onChange={handleCustomTheme} /></label>
                <label>Hover <input type="color" name="--link-hover" onChange={handleCustomTheme} /></label>
              </div>
            )}
          </div>
        </header>

        {/* ================= DASHBOARD HOME ================= */}
        {enInicio && (
          <>
            <h3 className="section-title">Mis cursos</h3>

            {errorCursos ? (
              <p className="empty-text">No se pudieron cargar tus cursos. Recarga la página e inténtalo de nuevo.</p>
            ) : cargandoCursos ? (
              <div className="dashboard-grid" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="dashboard-card pf-esqueleto" aria-hidden="true" />
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <p className="empty-text">Aún no tienes cursos asignados.</p>
            ) : (
              <div className="dashboard-grid">
                {cursos.map((curso) => {
                  const cursoId = curso.id || curso._id;
                  return (
                    <article key={cursoId} className="dashboard-card">
                      <div className="pf-curso-cabecera">
                        <span className="pf-curso-icono" aria-hidden="true">
                          <FaBookOpen />
                        </span>
                        <h4>{curso.nombre}</h4>
                      </div>
                      <div className="curso-actions">
                        <button
                          type="button"
                          className="pf-accion pf-accion--principal"
                          onClick={() => navigate(`/profesor/cursos/${cursoId}/editar`)}
                        >
                          <FaPen /> Editar curso
                        </button>
                        <button type="button" className="pf-accion" onClick={() => navigate(`/profesor/cursos/${cursoId}/alumnos`)}>
                          <FaUsers /> Alumnos
                        </button>
                        <button type="button" className="pf-accion" onClick={() => navigate(`/profesor/cursos/${cursoId}/examenes`)}>
                          <FaClipboardList /> Exámenes
                        </button>
                        <button type="button" className="pf-accion" onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles`)}>
                          <FaLayerGroup /> Niveles
                        </button>
                        <button type="button" className="pf-accion" onClick={() => navigate(`/profesor/cursos/${cursoId}/lecciones`)}>
                          <FaListUl /> Lecciones
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ================= KMEANS ================= */}
            <h3 className="section-title">¿Cómo se agrupan tus cursos?</h3>
            <p className="pf-intro">
              Comparamos tus cursos según su <strong>precio</strong> y su <strong>cantidad de videos</strong>, y
              juntamos los que se parecen entre sí. Así puedes ver de un vistazo qué tipo de cursos ofreces más.
            </p>

            {loadingKmeans && <p className="empty-text">Cargando análisis...</p>}
            {errorKmeans && <p className="pf-error">{errorKmeans}</p>}
            {kmeansData?.error && <p className="pf-error">{kmeansData.error}</p>}

            {kmeansData && !kmeansData.error && (
              <>
                <div className="pf-stats">
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{totalRegistros}</span>
                    <span className="pf-stat-etiqueta">Cursos analizados</span>
                    <span className="pf-stat-ayuda">Todos los cursos que tienes publicados.</span>
                  </div>
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{grupos.length}</span>
                    <span className="pf-stat-etiqueta">Grupos encontrados</span>
                    <span className="pf-stat-ayuda">Cada grupo reúne cursos con precio y videos parecidos.</span>
                  </div>
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{lecturaSilhouette.texto}</span>
                    <span className="pf-stat-etiqueta">
                      Qué tan claros son los grupos {silhouette !== undefined && silhouette !== null && `(${silhouette})`}
                    </span>
                    <span className="pf-stat-ayuda">{lecturaSilhouette.detalle}</span>
                  </div>
                </div>

                <div className="pf-kmeans">
                  <div className="pf-panel">
                    <h4>Cantidad de cursos en cada grupo</h4>
                    {gruposMayores.length === 1 && (
                      <p className="pf-resumen">
                        La mayoría de tus cursos están en el grupo{" "}
                        <strong style={{ color: gruposMayores[0].color }}>{gruposMayores[0].etiqueta}</strong>{" "}
                        ({plural(gruposMayores[0].count, "curso", "cursos")} de {totalRegistros}).
                      </p>
                    )}
                    {gruposMayores.length > 1 && (
                      <p className="pf-resumen">
                        Los grupos con más cursos son{" "}
                        {gruposMayores.map((g, i) => (
                          <React.Fragment key={g.cluster}>
                            {i > 0 && (i === gruposMayores.length - 1 ? " y " : ", ")}
                            <strong style={{ color: g.color }}>{g.etiqueta}</strong>
                          </React.Fragment>
                        ))}
                        , con {plural(maxCursos, "curso", "cursos")} cada uno.
                      </p>
                    )}
                    <div className="pf-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={grupos} margin={{ top: 28, right: 8, left: 8, bottom: 8 }}>
                          <CartesianGrid vertical={false} stroke="var(--card-border)" />
                          <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 13, fontWeight: 600 }} />
                          <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "currentColor", fontSize: 12 }}
                            label={{ value: "Número de cursos", angle: -90, position: "insideLeft", fill: "currentColor", fontSize: 12, style: { textAnchor: "middle" } }}
                          />
                          <Tooltip content={<TooltipGrupo />} cursor={{ fill: "rgba(128,128,128,0.12)" }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={72}>
                            {grupos.map((g) => (
                              <Cell key={g.cluster} fill={g.color} />
                            ))}
                            <LabelList
                              dataKey="etiquetaBarra"
                              content={({ x, y, width, value }) => (
                                <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="currentColor" fontSize={12} fontWeight={600}>
                                  {value}
                                </text>
                              )}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="pf-nota">
                      <strong>¿Cómo leer esta gráfica?</strong> Cada barra es un grupo de cursos parecidos. Entre más alta
                      la barra, más cursos tuyos hay en ese grupo. Pasa el cursor sobre una barra para ver qué tienen en común.
                    </div>
                  </div>

                  <div className="pf-panel">
                    <h4>¿Qué tiene cada grupo?</h4>
                    <ul className="pf-grupos">
                      {grupos.map((g) => (
                        <li key={g.cluster} className="pf-grupo" style={{ borderLeftColor: g.color }}>
                          <div className="pf-grupo-cabecera">
                            <span className="pf-grupo-nombre">{g.etiqueta}</span>
                            <span className="pf-grupo-cantidad">{plural(g.count, "curso", "cursos")}</span>
                          </div>
                          <div className="pf-grupo-datos">
                            <span>Precio promedio: <strong>{g.precioTexto}</strong></span>
                            <span>Videos promedio: <strong>{g.videosTexto}</strong></span>
                          </div>
                          <div className="pf-barra" aria-label={`${g.porcentaje.toFixed(0)}% de tus cursos`}>
                            <div className="pf-barra-relleno" style={{ width: `${g.porcentaje}%`, backgroundColor: g.color }} />
                          </div>
                          <span className="pf-grupo-pct">{g.porcentaje.toFixed(0)}% de tus cursos</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <Outlet />
      </main>
    </div>
  );
}

export default ProfesorPanel;