import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from "chart.js";
import {
  FaSignOutAlt,
  FaUserEdit,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaUsers,
  FaDatabase,
  FaUserPlus,
  FaPlusCircle
} from "react-icons/fa";
import "../styles/PrincipalAdmin.css";
import "../../temas/temas.css";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const API = "https://apidevrootdark.onrender.com/api";
const CUSTOM_VARS = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
const COLOR_USUARIOS = "#6366f1";
const COLOR_CURSOS = "#f59e0b";

function PrincipalAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [fotoError, setFotoError] = useState(false);
  const [estadisticas, setEstadisticas] = useState({ usuarios_registrados: 0, cursos_creados: 0 });
  const [cursosRecientes, setCursosRecientes] = useState([]);
  const [usuariosRecientes, setUsuariosRecientes] = useState([]);

  const [user, setUser] = useState(() => {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  });

  // Sincronizar usuario
  useEffect(() => {
    const syncUser = () => {
      const actualizado = localStorage.getItem("usuario");
      if (actualizado) setUser(JSON.parse(actualizado));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // Aplicar tema + color de texto de las gráficas
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color").trim();
    if (textColor) ChartJS.defaults.color = textColor;
  }, [theme]);

  // Colores personalizados guardados
  useEffect(() => {
    CUSTOM_VARS.forEach((variable) => {
      const saved = localStorage.getItem(variable);
      if (saved) document.documentElement.style.setProperty(variable, saved);
    });
  }, []);

  // Carga de datos (ya no se reinicia al cambiar de tema)
  useEffect(() => {
    const cargar = () => {
      fetch(`${API}/estadisticas`)
        .then((res) => res.json())
        .then(setEstadisticas)
        .catch((e) => console.error("Error al cargar estadísticas:", e));

      fetch(`${API}/cursos/recientes`)
        .then((res) => res.json())
        .then(setCursosRecientes)
        .catch((e) => console.error("Error al cargar cursos recientes:", e));

      fetch(`${API}/usuarios/recientes`)
        .then((res) => res.json())
        .then(setUsuariosRecientes)
        .catch((e) => console.error("Error al cargar usuarios recientes:", e));
    };

    cargar();
    const intervalId = setInterval(cargar, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    CUSTOM_VARS.forEach((variable) => {
      document.documentElement.style.removeProperty(variable);
      localStorage.removeItem(variable);
    });
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const labels = ["Usuarios", "Cursos"];
  const valores = [estadisticas.usuarios_registrados, estadisticas.cursos_creados];
  const colores = [COLOR_USUARIOS, COLOR_CURSOS];

  const barData = {
    labels,
    datasets: [{ label: "Cantidad", data: valores, backgroundColor: colores, borderRadius: 10, maxBarThickness: 70 }]
  };

  const doughnutData = {
    labels,
    datasets: [{ data: valores, backgroundColor: colores, borderWidth: 0, hoverOffset: 8 }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(128,128,128,0.15)" } },
      x: { grid: { display: false } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 18 } } }
  };

  const fotoPerfil = user?.foto_perfil
    ? user.foto_perfil.startsWith("data:image")
      ? user.foto_perfil
      : `data:image/png;base64,${user.foto_perfil}`
    : null;
  const inicial = (user?.nombre || "?").trim().charAt(0).toUpperCase();

  const navClass = ({ isActive }) => `admin-link${isActive ? " active" : ""}`;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">Panel de Administración</div>

        {user && (
          <div className="profile">
            {fotoPerfil && !fotoError ? (
              <img
                src={fotoPerfil}
                alt="Foto de perfil"
                className="profile-pic"
                onError={() => setFotoError(true)}
              />
            ) : (
              <div className="profile-pic profile-initial" aria-hidden="true">{inicial}</div>
            )}
            <div className="profile-info">
              <span className="profile-name">{user.nombre}</span>
              <span className="profile-role">Administrador</span>
            </div>
          </div>
        )}

        <nav className="admin-nav">
          <NavLink to="/admin" end className={navClass}>
            <FaHome /> Inicio
          </NavLink>
          <NavLink to="/admin/cursos" className={navClass}>
            <FaBookOpen /> Cursos
          </NavLink>
          <NavLink to="/admin/usuarios" className={navClass}>
            <FaUsers /> Usuarios
          </NavLink>
          <NavLink to="/admin/respaldo" className={navClass}>
            <FaDatabase /> Respaldo
          </NavLink>
        </nav>

        <div className="profile-actions">
          <button className="edit-btn" onClick={() => navigate("/admin/editar-perfil")}>
            <FaUserEdit /> Editar perfil
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {location.pathname === "/admin" && (
          <>
            <header className="dashboard-header">
              <div>
                <h2 className="dashboard-title">Hola, {user?.nombre}</h2>
                <p className="dashboard-welcome">Así se ve la plataforma en este momento.</p>
              </div>

              <div className="tema-icon">
                <button
                  className="tema-toggle"
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  aria-label="Personalizar tema"
                  aria-expanded={showCustomizer}
                >
                  <FaPalette size={18} />
                </button>
                {showCustomizer && (
                  <div className="tema-menu">
                    <h4>Tema</h4>
                    <div className="tema-options">
                      <button className={theme === "light" ? "sel" : ""} onClick={() => changeTheme("light")}>Claro</button>
                      <button className={theme === "dark" ? "sel" : ""} onClick={() => changeTheme("dark")}>Oscuro</button>
                      <button className={theme === "blue" ? "sel" : ""} onClick={() => changeTheme("blue")}>Azul</button>
                      <button className={theme === "green" ? "sel" : ""} onClick={() => changeTheme("green")}>Verde</button>
                    </div>
                    <h4>Personalizar</h4>
                    <label>Fondo <input type="color" name="--bg-color" onChange={handleCustomTheme} /></label>
                    <label>Texto <input type="color" name="--text-color" onChange={handleCustomTheme} /></label>
                    <label>Tarjeta <input type="color" name="--card-bg" onChange={handleCustomTheme} /></label>
                    <label>Borde tarjeta <input type="color" name="--card-border" onChange={handleCustomTheme} /></label>
                    <label>Enlaces <input type="color" name="--link-color" onChange={handleCustomTheme} /></label>
                    <label>Hover enlaces <input type="color" name="--link-hover" onChange={handleCustomTheme} /></label>
                  </div>
                )}
              </div>
            </header>

            <section className="dashboard-cards">
              <div className="kpi-card">
                <div className="kpi-icon usuarios"><FaUsers /></div>
                <div>
                  <p className="kpi-value">{estadisticas.usuarios_registrados}</p>
                  <h4>Usuarios registrados</h4>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon cursos"><FaBookOpen /></div>
                <div>
                  <p className="kpi-value">{estadisticas.cursos_creados}</p>
                  <h4>Cursos creados</h4>
                </div>
              </div>
            </section>

            <section className="dashboard-charts">
              <div className="panel chart-box">
                <h4>Distribución general</h4>
                <div className="chart-canvas">
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
              <div className="panel chart-box">
                <h4>Proporción</h4>
                <div className="chart-canvas">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </section>

            <section className="dashboard-recent">
              <div className="panel">
                <h4>Cursos recientes</h4>
                {cursosRecientes.length === 0 ? (
                  <p className="empty">Aún no hay cursos. Crea el primero desde la sección Cursos.</p>
                ) : (
                  <ul>
                    {cursosRecientes.map((curso) => (
                      <li key={curso.id}>
                        <span className="dot cursos"><FaPlusCircle /></span>
                        <span>{curso.nombre}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="panel">
                <h4>Usuarios recientes</h4>
                {usuariosRecientes.length === 0 ? (
                  <p className="empty">Todavía no se registran usuarios nuevos.</p>
                ) : (
                  <ul>
                    {usuariosRecientes.map((usuario) => (
                      <li key={usuario.id}>
                        <span className="dot usuarios"><FaUserPlus /></span>
                        <span>{usuario.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export default PrincipalAdmin;