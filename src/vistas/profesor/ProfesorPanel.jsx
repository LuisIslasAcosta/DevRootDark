import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaCog,
  FaClipboardList,
  FaChartBar
} from "react-icons/fa";

import "../styles/ProfesorPanel.css";
import "../../temas/temas.css";

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= USER =================
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });

  // ================= THEME =================
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  // ================= DATA =================
  const [cursos, setCursos] = useState([]);

  // ================= SYNC USER =================
  useEffect(() => {
    const syncUser = () => {
      const updated = localStorage.getItem("usuario");
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // ================= APPLY THEME =================
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const vars = [
      "--bg-color",
      "--text-color",
      "--card-bg",
      "--link-color",
      "--card-border",
      "--link-hover"
    ];
    vars.forEach(v => {
      document.documentElement.style.removeProperty(v);
      localStorage.removeItem(v);
    });
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  useEffect(() => {
    const vars = [
      "--bg-color",
      "--text-color",
      "--card-bg",
      "--link-color",
      "--card-border",
      "--link-hover"
    ];
    vars.forEach(v => {
      const saved = localStorage.getItem(v);
      if (saved) document.documentElement.style.setProperty(v, saved);
    });
  }, []);

  // ================= LOAD COURSES =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCursos(res.data || []))
      .catch(err => {
        console.error("Error cursos:", err);
        if (err.response?.status === 401) navigate("/login");
      });
  }, [navigate]);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <img
            src={
              user?.foto_perfil
                ? (user.foto_perfil.startsWith("data:image")
                  ? user.foto_perfil
                  : `data:image/png;base64,${user.foto_perfil}`)
                : "/default-avatar.png"
            }
            alt="Perfil"
            className="profile-pic"
          />
          <h5>{user?.nombre || "Profesor"}</h5>
          <button 
            onClick={() => navigate("/profesor/editar-perfil")}
            className="theme-btn icon-btn"
            title="Editar perfil"
          >
            <FaCog />
          </button>
        </div>

        <h4 className="sidebar-brand">Panel del Profesor</h4>

        <nav className="sidebar-nav">
          <button onClick={() => navigate("/profesor")}><FaHome /> Inicio</button>
          <button onClick={() => navigate("/profesor/cursos")}><FaBookOpen /> Cursos</button>
          <button onClick={() => navigate("/profesor/examenes")}><FaClipboardList /> Exámenes</button>
          <button onClick={() => navigate("/profesor/reportes")}><FaChartBar /> Reportes</button>
        </nav>

        <div className="sidebar-profile">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="dashboard-main">

        {/* ================= TOPBAR ================= */}
        <div className="dashboard-topbar">
          <div>
            <h2>Bienvenido, {user?.nombre || "Profesor"}</h2>
            <p>Administra tus cursos, alumnos, exámenes y lecciones</p>
          </div>

          <div className="tema-dropdown">
            <button onClick={() => setShowCustomizer(!showCustomizer)}>
              <FaPalette />
            </button>
            {showCustomizer && (
              <div className="tema-menu">
                <h4>Seleccionar tema</h4>
                <button onClick={() => changeTheme("light")}>Claro</button>
                <button onClick={() => changeTheme("dark")}>Oscuro</button>
                <button onClick={() => changeTheme("blue")}>Azul</button>
                <button onClick={() => changeTheme("green")}>Verde</button>

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
        </div>

        {/* ================= DASHBOARD HOME ================= */}
        {location.pathname === "/profesor" && (
          <>
            <h3 className="section-title">Mis cursos</h3>
            <div className="dashboard-grid">
              {cursos.length === 0 ? (
                <p className="empty-text">No hay cursos disponibles</p>
              ) : (
                cursos.map(curso => {
                  const cursoId = curso.id || curso._id;
                  return (
                    <div key={cursoId} className="dashboard-card">
                      <h4>{curso.nombre}</h4>
                      <div className="curso-actions">
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/editar`)}>
                          Editar curso
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/alumnos`)}>
                          Ver alumnos
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/examenes`)}>
                          Ver exámenes
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles`)}>
                          Ver niveles
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/lecciones`)}>
                          Ver lecciones
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        <Outlet />
      </main>
    </div>
  );
}

export default ProfesorPanel;
