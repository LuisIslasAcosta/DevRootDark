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
  FaListUl
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import "../../temas/temas.css";

const API = "https://apidevrootdark.onrender.com/api";
const CUSTOM_VARS = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];

const etiquetaCluster = (v) => (typeof v === "number" ? `Cluster ${v}` : v);

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= USER =================
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });
  const [fotoError, setFotoError] = useState(false);

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
    ? user.foto_perfil.startsWith("data:image")
      ? user.foto_perfil
      : `data:image/png;base64,${user.foto_perfil}`
    : null;
  const nombre = user?.nombre || "Profesor";
  const inicial = nombre.trim().charAt(0).toUpperCase();

  const distribucion = kmeansData?.distribucion || [];
  const totalRegistros = useMemo(
    () => distribucion.reduce((suma, d) => suma + (Number(d.count) || 0), 0),
    [distribucion]
  );
  const silhouette =
    typeof kmeansData?.silhouette === "number" ? kmeansData.silhouette.toFixed(3) : kmeansData?.silhouette;

  const navClass = ({ isActive }) => `pf-link${isActive ? " active" : ""}`;

  return (
    <div className="pf-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="pf-sidebar">
        <div className="pf-brand">Panel del Profesor</div>

        <div className="pf-perfil">
          {foto && !fotoError ? (
            <img src={foto} alt="Foto de perfil" className="pf-avatar" onError={() => setFotoError(true)} />
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
          <NavLink to="/profesor/examenes" className={navClass}>
            <FaClipboardList /> Exámenes
          </NavLink>
          <NavLink to="/profesor/reportes" className={navClass}>
            <FaChartBar /> Reportes
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
            <h3 className="section-title">Análisis de alumnos (KMeans)</h3>

            {loadingKmeans && <p className="empty-text">Cargando análisis...</p>}
            {errorKmeans && <p className="pf-error">{errorKmeans}</p>}

            {kmeansData && (
              <>
                <div className="pf-stats">
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{totalRegistros}</span>
                    <span className="pf-stat-etiqueta">Registros analizados</span>
                  </div>
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{distribucion.length}</span>
                    <span className="pf-stat-etiqueta">Clusters</span>
                  </div>
                  <div className="pf-stat">
                    <span className="pf-stat-valor">{silhouette}</span>
                    <span className="pf-stat-etiqueta">Silhouette score</span>
                  </div>
                </div>

                <div className="pf-kmeans">
                  <div className="pf-panel">
                    <h4>Distribución por cluster</h4>
                    <div className="pf-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distribucion} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="var(--card-border)" />
                          <XAxis dataKey="cluster" tickFormatter={etiquetaCluster} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={etiquetaCluster}
                            formatter={(valor) => [valor, "Registros"]}
                            cursor={{ fill: "rgba(128,128,128,0.12)" }}
                            contentStyle={{
                              background: "var(--card-bg)",
                              border: "1px solid var(--card-border)",
                              borderRadius: 12,
                              color: "var(--text-color)"
                            }}
                            labelStyle={{ color: "var(--text-color)", fontWeight: 700 }}
                            itemStyle={{ color: "var(--text-color)" }}
                          />
                          <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={64} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="pf-nota">
                      El silhouette score va de -1 a 1; mientras más cercano a 1, mejor definidos están los grupos.
                    </p>
                  </div>

                  <div className="pf-panel">
                    <h4>Detalle por cluster</h4>
                    <div className="pf-tabla-wrap">
                      <table className="pf-tabla">
                        <thead>
                          <tr>
                            <th>Cluster</th>
                            <th>Registros</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {distribucion.map((item, index) => (
                            <tr key={index}>
                              <td>{etiquetaCluster(item.cluster)}</td>
                              <td>{item.count}</td>
                              <td>{totalRegistros > 0 ? `${((item.count / totalRegistros) * 100).toFixed(1)}%` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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