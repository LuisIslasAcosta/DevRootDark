import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaUser,
  FaClipboardList,
  FaChartLine,
  FaSearch,
  FaGraduationCap,
  FaCheckCircle
} from "react-icons/fa";

import "../styles/ProfesorPanel.css";
import "../styles/EstilosAlumno.css";
import "../../temas/temas.css";
import "../styles/ProgresoAcademico.css";
import { API_URL, urlArchivo } from "../../config";
import Logo from "../../componentes/Logo";
import PagoInscripcionModal from "../../componentes/PagoInscripcionModal";
import { inscribirseCurso, obtenerMisInscripciones, mensajeError } from "../../componentes/pagos";

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
  const [inscripciones, setInscripciones] = useState({}); // curso_id -> inscripción
  const [pagoAbierto, setPagoAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("todos"); // todos | mios | gratis

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
        const insRes = await obtenerMisInscripciones();
        const mapa = {};
        (Array.isArray(insRes.data) ? insRes.data : []).forEach(i => { mapa[i.curso_id] = i; });
        setInscripciones(mapa);
      } catch {
        setInscripciones({});
      }
    };

    cargarCursos();
    cargarInscripciones();

  }, [navigate, user]);

  // ================= IR A UN CURSO DEL CATÁLOGO (#curso-id) =================
  useEffect(() => {
    if (location.pathname !== "/principal" || !location.hash || cursos.length === 0) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [location.pathname, location.hash, cursos.length]);

  const cursosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return cursos.filter((c) => {
      if (vista === "mios" && inscripciones[c.id]?.estado !== "aceptada") return false;
      if (vista === "gratis" && Number(c.precio) > 0) return false;
      if (texto && !`${c.nombre} ${c.descripcion}`.toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [cursos, inscripciones, busqueda, vista]);

  const totalInscritos = Object.values(inscripciones).filter((i) => i.estado === "aceptada").length;

  // ================= INSCRIBIRSE =================
  const inscribirse = async (cursoId) => {
    if (!user?.id) return alert("Usuario no válido");

    try {
      const res = await inscribirseCurso(cursoId);
      const inscripcion = res.data.inscripcion;
      setInscripciones(prev => ({ ...prev, [cursoId]: inscripcion }));

      if (inscripcion.estado === "aceptada") alert("¡Listo! El curso es gratuito y ya tienes acceso.");
      else setPagoAbierto(inscripcion); // muestra el ID de pago y el formulario del comprobante

    } catch (err) {
      alert(mensajeError(err, "Error al inscribirse"));
    }
  };

  const actualizarInscripcion = (nueva) => {
    setInscripciones(prev => ({ ...prev, [nueva.curso_id]: nueva }));
    setPagoAbierto(nueva);
  };

  // Botón según el estado de la inscripción
  const botonInscripcion = (curso) => {
    const ins = inscripciones[curso.id];
    if (!ins) {
      return (
        <button className="btn-modern" onClick={() => inscribirse(curso.id)}>
          {Number(curso.precio) > 0 ? `Inscribirse · $${Number(curso.precio).toFixed(2)}` : "Inscribirse (gratis)"}
        </button>
      );
    }
    if (ins.estado === "aceptada") return <button className="btn-modern" disabled>Inscrito</button>;
    const textos = {
      pendiente_pago: "Pagar y subir comprobante",
      en_revision: "Pago en revisión",
      rechazada: "Pago rechazado · reenviar"
    };
    return (
      <button className="btn-modern" onClick={() => setPagoAbierto(ins)}>
        {textos[ins.estado] || "Ver pago"}
      </button>
    );
  };

  // ================= PERFIL (barra lateral) =================
  const [fotoError, setFotoError] = useState(false);
  const fotoPerfil = user?.foto_perfil
    ? (/^(data:image|https?:)/.test(user.foto_perfil) ? user.foto_perfil : `data:image/png;base64,${user.foto_perfil}`)
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
            <img src={fotoPerfil} alt="Foto de perfil" className="pf-avatar" referrerPolicy="no-referrer" onError={() => setFotoError(true)} />
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

        {/* ================= CAMPUS: CATÁLOGO DE CURSOS ================= */}
        {location.pathname === "/principal" && (
          <div className="mp campus">
            <header className="mp-hero">
              <div>
                <span className="mp-hero-sub"><FaGraduationCap /> Campus DevRootDark</span>
                <h2>¿Qué vas a aprender hoy?</h2>
                <p>Elige un curso, avanza a tu ritmo con lecciones y exámenes, y revisa tu progreso en cualquier momento.</p>
              </div>
              <div className="campus-cifras">
                <div><strong>{cursos.length}</strong><span>cursos disponibles</span></div>
                <div><strong>{totalInscritos}</strong><span>{totalInscritos === 1 ? "curso inscrito" : "cursos inscritos"}</span></div>
                <Link to="/principal/analisis-respuestas" className="campus-cifra-link"><FaChartLine /> Ver mi progreso</Link>
              </div>
            </header>

            <div className="campus-barra">
              <div className="campus-buscar">
                <FaSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Buscar un curso (ej. Python, Arduino, React)"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  aria-label="Buscar curso"
                />
              </div>
              <div className="mp-filtro">
                <button type="button" className={vista === "todos" ? "activo" : ""} onClick={() => setVista("todos")}>Todos</button>
                <button type="button" className={vista === "mios" ? "activo" : ""} onClick={() => setVista("mios")}>Mis cursos</button>
                <button type="button" className={vista === "gratis" ? "activo" : ""} onClick={() => setVista("gratis")}>Gratis</button>
              </div>
            </div>

            {cursosFiltrados.length === 0 ? (
              <div className="mp-vacio"><p>{cursos.length === 0 ? "No hay cursos disponibles por ahora." : "No encontramos cursos con esa búsqueda."}</p></div>
            ) : (
              <div className="campus-grid">
                {cursosFiltrados.map((curso) => {
                  const ins = inscripciones[curso.id];
                  const inscrito = ins?.estado === "aceptada";
                  const img = curso.imagenes?.[0];
                  const precio = Number(curso.precio) || 0;
                  return (
                    <article key={curso.id} id={`curso-${curso.id}`} className={`campus-curso${inscrito ? " campus-inscrito" : ""}`}>
                      <div className="campus-portada">
                        {img ? (
                          <img src={/^https?:/.test(img) ? img : urlArchivo(img)} alt="" loading="lazy" />
                        ) : (
                          <div className="campus-portada-vacia"><FaBookOpen /></div>
                        )}
                        <span className={`campus-precio${precio > 0 ? "" : " gratis"}`}>
                          {precio > 0 ? `$${precio.toFixed(2)}` : "Gratis"}
                        </span>
                        {inscrito && <span className="campus-estado"><FaCheckCircle /> Inscrito</span>}
                      </div>
                      <div className="campus-cuerpo">
                        <h3>{curso.nombre}</h3>
                        <p>{curso.descripcion}</p>
                        <div className="campus-acciones">
                          {inscrito ? (
                            <Link to={`/principal/cursos/${curso.id}`} className="mp-btn">Entrar al curso</Link>
                          ) : (
                            botonInscripcion(curso)
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}


        <Outlet />

        <PagoInscripcionModal
          show={!!pagoAbierto}
          inscripcion={pagoAbierto}
          onHide={() => setPagoAbierto(null)}
          onActualizada={actualizarInscripcion}
        />

      </main>
    </div>
  );
}

export default PrincipalAlumno;
