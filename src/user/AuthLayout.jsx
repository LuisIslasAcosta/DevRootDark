import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import Logo from "../componentes/Logo";
import "./styles/auth.css";

const PUNTOS = [
  "Cursos por niveles con lecciones prácticas",
  "Exámenes con calificación al instante",
  "Seguimiento de tu progreso en cada curso",
];

/**
 * Diseño común de iniciar sesión y registro:
 * panel de marca a la izquierda (siempre oscuro) y formulario a la derecha (sigue el tema).
 */
function AuthLayout({ titulo, subtitulo, ancho = "normal", children }) {
  useEffect(() => {
    const tema = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", tema);
  }, []);

  return (
    <div className={`au au--${ancho}`}>
      <aside className="au-marca">
        <div className="au-marca__fondo" aria-hidden="true" />
        <Link to="/" className="au-marca__logo" aria-label="Volver al inicio">
          <Logo variante="banner" />
        </Link>
        <div className="au-marca__texto">
          <h2>
            Aprende a programar <span>desde la raíz</span>
          </h2>
          <ul>
            {PUNTOS.map((p) => (
              <li key={p}><FaCheckCircle aria-hidden="true" /> {p}</li>
            ))}
          </ul>
        </div>
        <p className="au-marca__pie">© {new Date().getFullYear()} DevRootDark</p>
      </aside>

      <main className="au-panel">
        <div className="au-panel__barra">
          <Link to="/" className="au-volver"><FaArrowLeft aria-hidden="true" /> Volver al inicio</Link>
          <Link to="/" className="au-panel__logo" aria-label="DevRootDark - Inicio">
            <Logo variante="nav" alto="34px" />
          </Link>
        </div>
        <div className="au-tarjeta">
          {titulo && (
            <header className="au-cabecera">
              <h1>{titulo}</h1>
              {subtitulo && <p>{subtitulo}</p>}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
