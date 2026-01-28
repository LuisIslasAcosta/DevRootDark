import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
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
import { FaSignOutAlt, FaUserEdit, FaPalette } from "react-icons/fa";
import "../styles/PrincipalAdmin.css";
import "../../temas/temas.css";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

function PrincipalAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    usuarios_registrados: 0,
    cursos_creados: 0
  });

  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // Refrescar usuario automáticamente cuando cambia localStorage
  useEffect(() => {
    const syncUser = () => {
      const usuarioActualizado = localStorage.getItem("usuario");
      if (usuarioActualizado) {
        setUser(JSON.parse(usuarioActualizado));
      }
    };

    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // Estadísticas con actualización periódica
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    const fetchEstadisticas = () => {
      fetch("http://127.0.0.1:5000/api/estadisticas")
        .then(res => res.json())
        .then(data => setEstadisticas(data))
        .catch(error => console.error("Error al cargar estadísticas:", error));
    };

    fetchEstadisticas();
    const intervalId = setInterval(fetchEstadisticas, 5000);
    return () => clearInterval(intervalId);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const customVars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
    customVars.forEach((variable) => {
      document.documentElement.style.removeProperty(variable);
      localStorage.removeItem(variable);
    });
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  useEffect(() => {
    const customVars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
    customVars.forEach((variable) => {
      const savedValue = localStorage.getItem(variable);
      if (savedValue) {
        document.documentElement.style.setProperty(variable, savedValue);
      }
    });
  }, []);

  const barData = {
    labels: ["Usuarios Registrados", "Cursos Creados"],
    datasets: [{
      label: "Cantidad",
      data: [estadisticas.usuarios_registrados, estadisticas.cursos_creados],
      backgroundColor: ["#007bff", "#ffc107"]
    }]
  };

  const pieData = {
    labels: ["Usuarios Registrados", "Cursos Creados"],
    datasets: [{
      data: [estadisticas.usuarios_registrados, estadisticas.cursos_creados],
      backgroundColor: ["#007bff", "#ffc107"]
    }]
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-top">
          {user && (
            <div className="profile">
              <img
                src={user.foto_perfil
                  ? (user.foto_perfil.startsWith("data:image")
                      ? user.foto_perfil
                      : `data:image/png;base64,${user.foto_perfil}`)
                  : "/default-avatar.png"}
                alt="Foto de perfil"
                className="profile-pic"
              />
              <span className="profile-name">{user.nombre}</span>

              <div className="profile-actions">
                <button className="edit-btn" onClick={() => navigate("/admin/editar-perfil")}>
                  <FaUserEdit /> Editar
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="brand">Panel de Administración</div>
        <nav className="admin-nav">
          <a className="admin-link" onClick={() => navigate("/admin")}>Inicio</a>
          <a className="admin-link" onClick={() => navigate("/admin/cursos")}>Cursos</a>
          <a className="admin-link" onClick={() => navigate("/admin/usuarios")}>Usuarios</a>
          <a className="admin-link" onClick={() => navigate("/admin/respaldo")}>Respaldo</a>
        </nav>
      </aside>

      <main className="admin-main">
        {location.pathname === "/admin" && (
          <>
                  {/* Botón de temas */}
        <div className="tema-icon">
          <button onClick={() => setShowCustomizer(!showCustomizer)}>
            <FaPalette size={22} />
          </button>
          {showCustomizer && (
            <div className="tema-menu desplegado">
              <h4>Seleccionar tema</h4>
              <button onClick={() => changeTheme("light")}>Claro</button>
              <button onClick={() => changeTheme("dark")}>Oscuro</button>
              <button onClick={() => changeTheme("blue")}>Azul</button>
              <button onClick={() => changeTheme("green")}>Verde</button>

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
            <h2 className="dashboard-title">Estadísticas de la plataforma</h2>
            <section className="dashboard-cards">
              <div className="card kpi-card">
                <h4>Usuarios registrados</h4>
                <p>{estadisticas.usuarios_registrados}</p>
              </div>
              <div className="card kpi-card">
                <h4>Cursos creados</h4>
                <p>{estadisticas.cursos_creados}</p>
              </div>
            </section>
            <section className="dashboard-charts">
              <div className="chart-box">
                <h4>Distribución general</h4>
                <Bar data={barData} />
              </div>
              <div className="chart-box">
                <h4>Proporción</h4>
                <Pie data={pieData} />
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