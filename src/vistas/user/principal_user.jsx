import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaUser,
  FaClipboardList,
  FaChartLine
} from "react-icons/fa";

import "../styles/ProfesorPanel.css";
import "../styles/EstilosAlumno.css";
import "../../temas/temas.css";
import { API_URL } from "../../config";
import Logo from "../../componentes/Logo";

function PrincipalAlumno() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= THEME =================
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  // ================= USER =================
  const [user, setUser] = useState(null);

  // ================= DATA =================
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);

  // ================= LOAD USER =================
  useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        try {
          setUser(JSON.parse(usuarioGuardado));
        } catch {
          setUser(null);
        }
      }
    };

    cargarUsuario();
    window.addEventListener("storage", cargarUsuario);
    return () => window.removeEventListener("storage", cargarUsuario);
  }, []);

  // ================= APPLY THEME =================
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

  // ================= LOAD COURSES & INSCRIPTIONS =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const cargarCursos = async () => {
      try {
        const cursosRes = await axios.get(`${API_URL}/cursos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCursos(Array.isArray(cursosRes.data) ? cursosRes.data : []);
      } catch {
        navigate("/login");
      }
    };

    const cargarInscripciones = async () => {
      if (!user?.id) return;

      try {
        const insRes = await axios.get(
          `${API_URL}/inscripciones/alumno/${user.id}`
        );

        const ids = Array.isArray(insRes.data)
          ? insRes.data.map(i => i.curso_id)
          : [];

        setInscripciones(ids);
      } catch {
        setInscripciones([]);
      }
    };

    cargarCursos();
    cargarInscripciones();

  }, [navigate, user]);

  // ================= INSCRIBIRSE =================
  const inscribirse = async (cursoId) => {
    if (!user?.id) return alert("Usuario no válido");

    try {
      await axios.post(`${API_URL}/inscripciones`, {
        curso_id: cursoId,
        alumno_id: user.id
      });

      alert("Inscripción realizada ");
      setInscripciones(prev => [...prev, cursoId]);

    } catch {
      alert("Error al inscribirse ");
    }
  };

  // ================= PERFIL (barra lateral) =================
  const [fotoError, setFotoError] = useState(false);
  const fotoPerfil = user?.foto_perfil
    ? (user.foto_perfil.startsWith("data:image") ? user.foto_perfil : `data:image/png;base64,${user.foto_perfil}`)
    : null;
  const nombreAlumno = user?.nombre || user?.username || "Alumno";
  const inicialNombre = nombreAlumno.trim().charAt(0).toUpperCase();
  const navClass = ({ isActive }) => `pf-link${isActive ? " active" : ""}`;

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">

      {/* ================= SIDEBAR ================= */}
      <aside className="pf-sidebar alumno-sidebar">
        <div className="pf-brand">
          <Logo variante="nav" alto="40px" className="sidebar-logo" />
          <span className="brand-texto">Panel del Alumno</span>
        </div>

        <div className="pf-perfil">
          {fotoPerfil && !fotoError ? (
            <img src={fotoPerfil} alt="Foto de perfil" className="pf-avatar" onError={() => setFotoError(true)} />
          ) : (
            <div className="pf-avatar pf-avatar--inicial" aria-hidden="true">{inicialNombre}</div>
          )}
          <div className="pf-perfil-info">
            <span className="pf-perfil-nombre">{nombreAlumno}</span>
            <span className="pf-perfil-rol">Alumno</span>
          </div>
        </div>

        <nav className="pf-nav">
          <NavLink to="/principal" end className={navClass}>
            <FaHome /> Inicio
          </NavLink>
          <NavLink to="/principal/mis-cursos" className={navClass}>
            <FaBookOpen /> Mis cursos
          </NavLink>
          <NavLink to="/principal/resultados" className={navClass}>
            <FaClipboardList /> Mis resultados
          </NavLink>
          <NavLink to="/principal/analisis-respuestas" className={navClass}>
            <FaChartLine /> Mi progreso
          </NavLink>
        </nav>

        <div className="pf-acciones-lado">
          <button type="button" className="pf-btn-lado" onClick={() => navigate("/alumno/perfil")}>
            <FaUser /> Editar perfil
          </button>
          <button type="button" className="pf-btn-lado pf-btn-lado--salir" onClick={handleLogout}>
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="dashboard-main">

        {/* ================= TOPBAR ================= */}
        <div className="dashboard-topbar">
          <div>
            <h2>Bienvenido, {user?.nombre || user?.username || "Alumno"}</h2>
            <p>Explora cursos y gestiona tus inscripciones</p>
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

        {/* ================= TODOS LOS CURSOS ================= */}
        {location.pathname === "/principal" && (
          <div className="file-grid">
            {cursos.length === 0 ? (
              <p className="empty-text">No hay cursos disponibles</p>
            ) : (
              cursos.map(curso => (
                <div key={curso.id} className="curso-form-card">

                  {curso.imagenes?.map((img, i) => (
                    <img
                      key={i}
                      src={`${API_URL}/uploads/imagenes/${img}`}
                      className="curso-thumb"
                      alt="Curso"
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
              ))
            )}
          </div>
        )}


        <Outlet />

      </main>
    </div>
  );
}

export default PrincipalAlumno;
