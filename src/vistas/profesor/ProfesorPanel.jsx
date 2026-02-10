import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaUsers,
  FaCog,
  FaClipboardList
} from "react-icons/fa";

import "../styles/ProfesorPanel.css";
import "../../temas/temas.css";

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [cursos, setCursos] = useState([]);
  const [alumnos, setAlumnos] = useState({});
  const [examenes, setExamenes] = useState({});

  // 🔹 Sincroniza usuario con storage
  useEffect(() => {
    const syncUser = () => {
      const usuarioActualizado = localStorage.getItem("usuario");
      if (usuarioActualizado) setUser(JSON.parse(usuarioActualizado));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // 🔹 Aplica tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const vars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
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
    const vars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
    vars.forEach(v => {
      const saved = localStorage.getItem(v);
      if (saved) document.documentElement.style.setProperty(v, saved);
    });
  }, []);

  // 🔹 Cargar cursos del profesor
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCursos(res.data))
      .catch(err => {
        console.error("Error al cargar cursos:", err);
        if (err.response?.status === 401) navigate("/login");
      });
  }, [navigate]);

  // 🔹 Cargar alumnos por curso
  const cargarAlumnos = (cursoId) => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}/alumnos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => setAlumnos(prev => ({ ...prev, [cursoId]: res.data })))
      .catch(err => console.error("Error al cargar alumnos:", err));
  };

  // 🔹 Cargar exámenes por curso
  const cargarExamenes = (cursoId) => {
    axios.get(`http://127.0.0.1:5000/api/examenes/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => setExamenes(prev => ({ ...prev, [cursoId]: res.data })))
      .catch(err => console.error("Error al cargar exámenes:", err));
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        {/* PERFIL */}
        <div className="sidebar-profile">
          <img
            src={user?.foto_perfil
              ? (user.foto_perfil.startsWith("data:image")
                ? user.foto_perfil
                : `data:image/png;base64,${user.foto_perfil}`)
              : "/default-avatar.png"}
            alt="Perfil"
            className="profile-pic"
          />
          <h5>{user?.nombre}</h5>
          <button 
            onClick={() => navigate("/profesor/editar-perfil")} 
            className="theme-btn icon-btn"
            title="Editar perfil"
          >
            <FaCog />
          </button>
        </div>

        {/* BRAND */}
        <h4 className="sidebar-brand">Panel del Profesor</h4>

        {/* NAV */}
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/profesor")}>
            <FaHome /> Inicio
          </button>

          <button onClick={() => navigate("/profesor/cursos")}>
            <FaBookOpen /> Cursos
          </button>

          <button onClick={() => navigate("/profesor/examenes")}>
            <FaClipboardList /> Exámenes
          </button>

          <button onClick={() => navigate("/profesor/alumnos")}>
            <FaUsers /> Alumnos
          </button>
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-profile">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">

        {/* TOPBAR */}
        <div className="dashboard-topbar">
          <div>
            <h2>Bienvenido, {user?.nombre}</h2>
            <p>Administra tus cursos, alumnos y exámenes</p>
          </div>

          {/* Panel de temas */}
            <div className="tema-dropdown">
              <button onClick={() => setShowCustomizer(!showCustomizer)}><FaPalette /></button>
              {showCustomizer && (
                <div className="tema-menu">
                  <h4>Seleccionar tema</h4>
                  <button className="tema-btn-light" onClick={() => changeTheme("light")}>Claro</button>
                  <button className="tema-btn-dark" onClick={() => changeTheme("dark")}>Oscuro</button>
                  <button className="tema-btn-blue" onClick={() => changeTheme("blue")}>Azul</button>
                  <button className="tema-btn-green" onClick={() => changeTheme("green")}>Verde</button>



                  <h4>Personalizar</h4>
                  <label>Fondo: <input type="color" name="--bg-color" onChange={handleCustomTheme} /></label>
                  <label>Texto: <input type="color" name="--text-color" onChange={handleCustomTheme} /></label>
                  <label>Tarjeta: <input type="color" name="--card-bg" onChange={handleCustomTheme} /></label>
                  <label>Borde tarjeta: <input type="color" name="--card-border" onChange={handleCustomTheme} /></label>
                  <label>Enlaces: <input type="color" name="--link-color" onChange={handleCustomTheme} /></label>
                  <label>Hover enlaces: <input type="color" name="--link-hover" onChange={handleCustomTheme} /></label>
                </div>
              )}
            </div>
        </div>

        {/* CURSOS */}
        {location.pathname === "/profesor" && (
          <>
            <h3 className="section-title">Mis cursos</h3>

            <div className="dashboard-grid">
              {cursos.length === 0 ? (
                <p className="empty-text">No hay cursos disponibles</p>
              ) : (
                cursos.map(curso => {
                  const cursoId = curso.id || curso._id;

                  // Función para eliminar examen
                  const eliminarExamen = async (exId) => {
                    const confirmar = window.confirm("¿Deseas eliminar este examen?");
                    if (!confirmar) return;
                    try {
                      await axios.delete(`http://127.0.0.1:5000/api/examenes/${exId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                      });
                      alert("Examen eliminado ✅");
                      setExamenes(prev => ({
                        ...prev,
                        [cursoId]: prev[cursoId].filter(ex => ex.id !== exId)
                      }));
                    } catch (err) {
                      console.error(err);
                      alert("Error al eliminar examen ❌");
                    }
                  };

                  return (
                    <div key={cursoId} className="dashboard-card">
                      <h4>{curso.nombre}</h4>

                      <div className="curso-actions">
                        <button onClick={() => cargarAlumnos(cursoId)}>Ver alumnos</button>
                        <button onClick={() => cargarExamenes(cursoId)}>Ver exámenes</button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/editar`)}>
                          Editar curso
                        </button>
                      </div>

                      {/* Lista de alumnos */}
                      {alumnos[cursoId] && (
                        <div className="curso-list">
                          <h6>Alumnos</h6>
                          <ul>
                            {alumnos[cursoId].map(al => (
                              <li key={al.id}>{al.nombre} — {al.email}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tabla de exámenes */}
                      {examenes[cursoId] && (
                        <div className="curso-list">
                          <h6>Exámenes</h6>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Título</th>
                                <th>Fecha</th>
                                <th># Preguntas</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {examenes[cursoId].map(ex => (
                                <tr key={ex.id}>
                                  <td>{ex.titulo}</td>
                                  <td>{ex.fecha}</td>
                                  <td>{ex.preguntas.length}</td>
                                  <td>
                                    <button
                                      className="custom-btn btn-eliminar"
                                      onClick={() => eliminarExamen(ex.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
