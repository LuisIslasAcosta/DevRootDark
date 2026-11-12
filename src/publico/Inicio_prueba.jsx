import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaLayerGroup, FaClipboardCheck, FaChartLine, FaChalkboardTeacher,
  FaSearch, FaChevronLeft, FaChevronRight, FaArrowRight, FaPalette, FaBars, FaTimes,
} from 'react-icons/fa';
import '../temas/temas.css';
import './styles/landing.css';
import { API_URL, urlArchivo } from "../config";
import Logo from "../componentes/Logo";

const POR_PAGINA = 9;
const VARIABLES_TEMA = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
const TEMAS = [
  { id: "light", nombre: "Claro", muestra: "#e9ecef" },
  { id: "dark", nombre: "Oscuro", muestra: "#121212" },
  { id: "blue", nombre: "Azul", muestra: "#0047b3" },
  { id: "green", nombre: "Verde", muestra: "#2e8b57" },
];
const PERSONALIZAR = [
  ["--bg-color", "Fondo"], ["--text-color", "Texto"], ["--card-bg", "Tarjetas"],
  ["--card-border", "Bordes"], ["--link-color", "Enlaces"], ["--link-hover", "Enlaces (hover)"],
];
const BENEFICIOS = [
  { icono: <FaLayerGroup />, titulo: "Aprende por niveles", texto: "Cada curso avanza de lo básico a lo avanzado con lecciones cortas y ejemplos de código." },
  { icono: <FaClipboardCheck />, titulo: "Exámenes al instante", texto: "Pon a prueba lo aprendido y recibe tu calificación en cuanto terminas." },
  { icono: <FaChartLine />, titulo: "Sigue tu progreso", texto: "Consulta tus resultados y descubre en qué temas necesitas reforzar." },
  { icono: <FaChalkboardTeacher />, titulo: "Profesores reales", texto: "Contenido creado y actualizado por profesores que acompañan tu avance." },
];

const precioTexto = (precio) => {
  const n = Number(precio);
  return !n ? "Gratis" : `$${n.toLocaleString("es-MX")} MXN`;
};

// Portada del curso; si no tiene imagen se muestra un degradado con la inicial
function Portada({ curso, className = "" }) {
  const [fallo, setFallo] = useState(false);
  const imagen = curso.imagenes?.[0];
  if (!imagen || fallo) {
    return (
      <div className={`ld-portada ld-portada--vacia ${className}`} aria-hidden="true">
        <span>{curso.nombre?.charAt(0) || "D"}</span>
      </div>
    );
  }
  return (
    <img
      className={`ld-portada ${className}`}
      src={urlArchivo(imagen)}
      alt={`Portada del curso ${curso.nombre}`}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  );
}

function Inicio() {
  const [cursos, setCursos] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [temasAbierto, setTemasAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Colores personalizados guardados
  useEffect(() => {
    VARIABLES_TEMA.forEach((variable) => {
      const valor = localStorage.getItem(variable);
      if (valor) document.documentElement.style.setProperty(variable, valor);
    });
  }, []);

  useEffect(() => {
    const leer = (url) => fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : []));
    Promise.all([leer(`${API_URL}/cursos`), leer(`${API_URL}/cursos/recientes`)])
      .then(([todos, nuevos]) => {
        setCursos(todos);
        setRecientes(nuevos.length ? nuevos : todos.slice(0, 5));
      })
      .catch((err) => console.error("Error al cargar cursos:", err))
      .finally(() => setCargando(false));
  }, []);

  // El carrusel avanza solo cada 6 segundos
  useEffect(() => {
    if (recientes.length < 2 || pausado) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % recientes.length), 6000);
    return () => clearInterval(id);
  }, [recientes.length, pausado]);

  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 10);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  const cambiarTema = (nuevo) => {
    setTheme(nuevo);
    localStorage.setItem("theme", nuevo);
    VARIABLES_TEMA.forEach((variable) => {
      document.documentElement.style.removeProperty(variable);
      localStorage.removeItem(variable);
    });
  };

  const personalizar = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return cursos;
    return cursos.filter((c) => `${c.nombre} ${c.descripcion} ${c.profesor}`.toLowerCase().includes(q));
  }, [cursos, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);
  const profesores = new Set(cursos.map((c) => c.profesor_id || c.profesor)).size;
  const destacado = recientes[indice];

  const cerrarMenu = () => setMenuAbierto(false);
  const mover = (paso) => setIndice((i) => (i + paso + recientes.length) % recientes.length);

  return (
    <div className="ld">
      {/* ===== Navegación ===== */}
      <header className={`ld-nav ${conSombra ? "ld-nav--sombra" : ""}`}>
        <div className="ld-contenedor ld-nav__fila">
          <Link to="/" className="ld-nav__logo" aria-label="DevRootDark - Inicio">
            <Logo variante="nav" alto="40px" />
          </Link>

          <button
            type="button"
            className="ld-nav__hamburguesa"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? <FaTimes /> : <FaBars />}
          </button>

          <nav className={`ld-nav__menu ${menuAbierto ? "ld-nav__menu--abierto" : ""}`}>
            <a href="#cursos" onClick={cerrarMenu}>Cursos</a>
            <a href="#beneficios" onClick={cerrarMenu}>¿Por qué DevRootDark?</a>

            <div className="ld-temas">
              <button
                type="button"
                className="ld-temas__boton"
                aria-expanded={temasAbierto}
                onClick={() => setTemasAbierto(!temasAbierto)}
              >
                <FaPalette /> Temas
              </button>
              {temasAbierto && (
                <div className="ld-temas__panel">
                  <p className="ld-temas__titulo">Tema</p>
                  <div className="ld-temas__opciones">
                    {TEMAS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`ld-temas__opcion ${theme === t.id ? "ld-temas__opcion--activa" : ""}`}
                        onClick={() => cambiarTema(t.id)}
                      >
                        <span className="ld-temas__muestra" style={{ background: t.muestra }} />
                        {t.nombre}
                      </button>
                    ))}
                  </div>
                  <p className="ld-temas__titulo">Personalizar</p>
                  <div className="ld-temas__colores">
                    {PERSONALIZAR.map(([variable, etiqueta]) => (
                      <label key={variable}>
                        <input type="color" name={variable} onChange={personalizar} />
                        {etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/login" className="ld-btn ld-btn--fantasma" onClick={cerrarMenu}>Iniciar sesión</Link>
            <Link to="/register" className="ld-btn ld-btn--primario" onClick={cerrarMenu}>Crear cuenta</Link>
          </nav>
        </div>
      </header>

      {/* ===== Portada ===== */}
      <section className="ld-hero">
        <div className="ld-hero__fondo" aria-hidden="true" />
        <div className="ld-contenedor ld-hero__fila">
          <div className="ld-hero__texto">
            <span className="ld-pastilla">Cursos de programación en línea</span>
            <h1>
              Aprende a programar <span className="ld-degradado">desde la raíz</span>
            </h1>
            <p>
              Cursos prácticos de Python, JavaScript, React, bases de datos y más,
              con lecciones por niveles y exámenes que se califican al instante.
            </p>
            <div className="ld-hero__acciones">
              <Link to="/register" className="ld-btn ld-btn--primario ld-btn--grande">
                Comenzar ahora <FaArrowRight />
              </Link>
              <a href="#cursos" className="ld-btn ld-btn--claro ld-btn--grande">Ver cursos</a>
            </div>
            <ul className="ld-cifras">
              <li><strong>{cursos.length || "—"}</strong><span>cursos</span></li>
              <li><strong>{profesores || "—"}</strong><span>profesores</span></li>
              <li><strong>24/7</strong><span>acceso</span></li>
            </ul>
          </div>

          <div
            className="ld-destacado"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
          >
            {destacado ? (
              <>
                <article className="ld-destacado__tarjeta" key={destacado.id}>
                  <div className="ld-destacado__imagen">
                    <Portada curso={destacado} />
                    <span className="ld-etiqueta">Nuevo</span>
                  </div>
                  <div className="ld-destacado__cuerpo">
                    <h2>{destacado.nombre}</h2>
                    <p>{destacado.descripcion || "Sin descripción"}</p>
                    <div className="ld-destacado__pie">
                      <span className="ld-precio">{precioTexto(destacado.precio)}</span>
                      <Link to="/register" className="ld-btn ld-btn--primario">Inscribirme</Link>
                    </div>
                  </div>
                </article>
                {recientes.length > 1 && (
                  <div className="ld-destacado__control">
                    <button type="button" className="ld-flecha" onClick={() => mover(-1)} aria-label="Curso anterior">
                      <FaChevronLeft />
                    </button>
                    <div className="ld-puntos">
                      {recientes.map((c, i) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`ld-punto ${i === indice ? "ld-punto--activo" : ""}`}
                          onClick={() => setIndice(i)}
                          aria-label={`Ver ${c.nombre}`}
                        />
                      ))}
                    </div>
                    <button type="button" className="ld-flecha" onClick={() => mover(1)} aria-label="Curso siguiente">
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="ld-destacado__tarjeta ld-esqueleto" aria-label="Cargando cursos" />
            )}
          </div>
        </div>
      </section>

      {/* ===== Beneficios ===== */}
      <section id="beneficios" className="ld-seccion">
        <div className="ld-contenedor">
          <div className="ld-encabezado">
            <span className="ld-pastilla ld-pastilla--suave">¿Por qué DevRootDark?</span>
            <h2>Todo lo que necesitas para avanzar</h2>
            <p>Una plataforma pensada para que aprendas a tu ritmo y veas tu progreso.</p>
          </div>
          <div className="ld-beneficios">
            {BENEFICIOS.map((b) => (
              <article key={b.titulo} className="ld-beneficio">
                <span className="ld-beneficio__icono">{b.icono}</span>
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Catálogo ===== */}
      <section id="cursos" className="ld-seccion ld-seccion--alterna">
        <div className="ld-contenedor">
          <div className="ld-catalogo__cabecera">
            <div className="ld-encabezado ld-encabezado--izquierda">
              <span className="ld-pastilla ld-pastilla--suave">Catálogo</span>
              <h2>Cursos disponibles</h2>
              <p>Elige un curso, crea tu cuenta y empieza hoy mismo.</p>
            </div>
            <label className="ld-buscador">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar curso o profesor"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              />
            </label>
          </div>

          {cargando ? (
            <div className="ld-cursos">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="ld-curso ld-esqueleto" />)}
            </div>
          ) : visibles.length === 0 ? (
            <p className="ld-vacio">
              {busqueda ? `No encontramos cursos para «${busqueda}».` : "Pronto habrá cursos disponibles."}
            </p>
          ) : (
            <div className="ld-cursos">
              {visibles.map((curso) => (
                <article key={curso.id} className="ld-curso">
                  <div className="ld-curso__imagen">
                    <Portada curso={curso} />
                    <span className="ld-precio ld-precio--flotante">{precioTexto(curso.precio)}</span>
                  </div>
                  <div className="ld-curso__cuerpo">
                    <h3>{curso.nombre}</h3>
                    {curso.profesor && <p className="ld-curso__profesor">Por {curso.profesor}</p>}
                    <p className="ld-curso__descripcion">{curso.descripcion || "Sin descripción"}</p>
                    <Link to="/login" className="ld-curso__enlace">
                      Ver curso <FaArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {filtrados.length > POR_PAGINA && (
            <div className="ld-paginacion">
              <button type="button" className="ld-flecha" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 1} aria-label="Página anterior">
                <FaChevronLeft />
              </button>
              <span>Página {paginaActual} de {totalPaginas}</span>
              <button type="button" className="ld-flecha" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} aria-label="Página siguiente">
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== Llamado final ===== */}
      <section className="ld-seccion">
        <div className="ld-contenedor">
          <div className="ld-cta">
            <div>
              <h2>¿Listo para escribir tu primera línea de código?</h2>
              <p>Crea tu cuenta gratis y elige el curso con el que quieres empezar.</p>
            </div>
            <Link to="/register" className="ld-btn ld-btn--primario ld-btn--grande">
              Crear mi cuenta <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <footer className="ld-pie">
        <div className="ld-contenedor ld-pie__fila">
          <Logo variante="nav" alto="32px" />
          <nav>
            <a href="#cursos">Cursos</a>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registrarse</Link>
            <Link to="/politicas">Políticas</Link>
          </nav>
          <p>© {new Date().getFullYear()} DevRootDark · Aprende a programar desde la raíz</p>
        </div>
      </footer>
    </div>
  );
}

export default Inicio;
