import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaUser
} from "react-icons/fa";

import "../styles/principaluser.css";
import "../../temas/temas.css";

function PrincipalAlumno() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);

  useEffect(() => {
    const syncUser = () => {
      const usuarioActualizado = localStorage.getItem("usuario");
      if (usuarioActualizado) setUser(JSON.parse(usuarioActualizado));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios.get("http://127.0.0.1:5000/api/cursos", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCursos(res.data))
      .catch(() => navigate("/login"));

    if (user) {
      axios.get(`http://127.0.0.1:5000/api/inscripciones/alumno/${user.id}`)
        .then(res => setInscripciones(res.data.map(i => i.curso_id)));
    }
  }, [navigate, user]);

  const inscribirse = async (cursoId) => {
    if (!user) return alert("Usuario no encontrado");

    try {
      await axios.post("http://127.0.0.1:5000/api/inscripciones", {
        curso_id: cursoId,
        alumno_id: user.id
      });
      alert("Inscripción realizada");
      setInscripciones(prev => [...prev, cursoId]);
    } catch {
      alert("Error al inscribirse");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
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

          <button onClick={() => navigate("/alumno/perfil")} className="theme-btn icon-btn">
            <FaUser />
          </button>
        </div>

        <h4 className="sidebar-brand">Panel del Alumno</h4>

        <nav className="sidebar-nav">
          <button onClick={() => navigate("/principal")}>
            <FaHome /> Inicio
          </button>
          <button onClick={() => navigate("/principal/alumno/mis-cursos")}>
            <FaBookOpen /> Mis Cursos
          </button>
        </nav>

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
            <p>Explora todos los cursos y inscríbete</p>
          </div>

          <div className="tema-dropdown">
            <button onClick={() => setShowCustomizer(!showCustomizer)}>
              <FaPalette />
            </button>

            {showCustomizer && (
              <div className="tema-menu">
                <button onClick={() => changeTheme("light")}>Claro</button>
                <button onClick={() => changeTheme("dark")}>Oscuro</button>
                <button onClick={() => changeTheme("blue")}>Azul</button>
                <button onClick={() => changeTheme("green")}>Verde</button>

                <label>Fondo <input type="color" name="--bg-color" onChange={handleCustomTheme} /></label>
                <label>Texto <input type="color" name="--text-color" onChange={handleCustomTheme} /></label>
                <label>Tarjeta <input type="color" name="--card-bg" onChange={handleCustomTheme} /></label>
              </div>
            )}
          </div>
        </div>

        {/* LISTA DE CURSOS */}
        {location.pathname === "/principal" && (
          <div className="file-grid">
            {cursos.map(curso => (
              <div key={curso.id} className="curso-form-card">

                {curso.imagenes?.map((img, i) => (
                  <img
                    key={i}
                    src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                    className="curso-thumb"
                  />
                ))}

                <h3>{curso.nombre}</h3>
                <p>{curso.descripcion}</p>

                {inscripciones.includes(curso.id) ? (
                  <button className="btn-modern" disabled>Inscrito</button>
                ) : (
                  <button className="btn-modern" onClick={() => inscribirse(curso.id)}>
                    Inscribirse
                  </button>
                )}

                <Link to={`/principal/cursos/${curso.id}`} className="btn-modern">
                  Ver Curso
                </Link>

              </div>
            ))}
          </div>
        )}

        {/* MIS CURSOS */}
        {location.pathname === "/alumno/cursos" && (
          <div className="file-grid">
            {cursos.filter(c => inscripciones.includes(c.id)).map(curso => (
              <div key={curso.id} className="curso-form-card">
                <h3>{curso.nombre}</h3>
                <p>{curso.descripcion}</p>
                <button className="btn-modern" disabled>Inscrito</button>
                <Link to={`/cursos/${curso.id}`} className="btn-modern">
                  Ver Curso
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* AQUÍ SE CARGA CURSO DETALLE */}
        <Outlet />

      </main>
    </div>
  );
}

export default PrincipalAlumno;
