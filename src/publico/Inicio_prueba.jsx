import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import { FaBookOpen } from 'react-icons/fa';
import '../publico/styles/inicio_prueba.css';
import '../publico/styles/navigation.css';
import '../publico/styles/layout.css';
import '../publico/styles/publicidad.css';
import '../publico/styles/sections.css';
import '../temas/temas.css';

function Inicio() {
  const [cursos, setCursos] = useState([]);
  const [cursosRecientes, setCursosRecientes] = useState([]);
  const [cursoIndex, setCursoIndex] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cargar cursos y aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    fetch('http://127.0.0.1:5000/api/cursos')
      .then(res => res.json())
      .then(data => setCursos(data))
      .catch(err => console.error("Error al cargar cursos:", err));

    fetch("http://127.0.0.1:5000/api/cursos/recientes")
      .then(res => res.json())
      .then(data => setCursosRecientes(data))
      .catch(error => console.error("Error al cargar cursos recientes:", error));
  }, [theme]);

  // Cambiar tema
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Limpiar variables personalizadas
    const customVars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
    customVars.forEach((variable) => {
      document.documentElement.style.removeProperty(variable);
      localStorage.removeItem(variable);
    });
  };

  // Manejar personalización de colores
  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  // Aplicar variables personalizadas guardadas
  useEffect(() => {
    const customVars = ["--bg-color", "--text-color", "--card-bg", "--link-color", "--card-border", "--link-hover"];
    customVars.forEach((variable) => {
      const savedValue = localStorage.getItem(variable);
      if (savedValue) {
        document.documentElement.style.setProperty(variable, savedValue);
      }
    });
  }, []);

  const imagenFija = "/src/publico/styles/student.jpg";

  return (
    <div className='Cuerpo-completo'>
      {/* NAV estilo glassy */}
      <nav className="nav glassy-nav">
        <div className="logo-container">
          <span className="logo-text">DevRootDark</span>
        </div>

        <div className={`menu ${menuAbierto ? 'open' : ''}`}>
          <button className="menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>☰</button>
          <div className="menu-links">
            <Link to="/" onClick={() => setMenuAbierto(false)}>Inicio</Link>
            <Link to="/login" onClick={() => setMenuAbierto(false)}>Iniciar Sesión</Link>
            <Link to="/register" onClick={() => setMenuAbierto(false)}>Registrarse</Link>

            {/* Panel de temas */}
            <div className="tema-dropdown">
              <button onClick={() => setShowCustomizer(!showCustomizer)}>Temas</button>
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
        </div>
      </nav>

      <div className="nav-spacer" />

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <h1>Bienvenido al Futuro del Aprendizaje</h1>
        <p>Explora cursos innovadores y desarrolla tus habilidades.</p>
        <Link to="/register" className="hero-button">Comenzar Ahora</Link>
      </section>

      {/* Carrusel de cursos recientes */}
      <Container className="cursos-recientes-hero">
        {cursosRecientes.length > 0 ? (
          <div className="carrusel-hero">
            <div className="carrusel-hero-item">
              <button 
                className="carrusel-btn-hero" 
                onClick={() => setCursoIndex(prev => prev > 0 ? prev - 1 : cursosRecientes.length - 1)}
              >
                ◀
              </button>

              <div className="hero-texto">
                <h2>{cursosRecientes[cursoIndex].nombre}</h2>
                <p>{cursosRecientes[cursoIndex].descripcion?.slice(0, 150) + "..." || "Sin descripción"}</p>
                <Link to="/register" className="btn-hero">Inscribirme</Link>
              </div>

              <div className="hero-img-container">
                <img src={imagenFija} alt="Imagen fija del curso" />
                <button 
                  className="carrusel-btn-hero" 
                  onClick={() => setCursoIndex(prev => prev < cursosRecientes.length - 1 ? prev + 1 : 0)}
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p>Cargando cursos recientes...</p>
        )}
      </Container>

      {/* Cursos dinámicos */}
      <Container className="cursos-1">
        <h2>Cursos Disponibles</h2>
        <ul className="cursos-completos">
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <li key={curso.id} className="curso-item">
                <div className="curso-img-container">
                  {curso.imagenes && curso.imagenes.map((img, i) => (
                    <img
                      key={i}
                      src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                      alt={`Imagen ${i + 1} de ${curso.nombre}`}
                    />
                  ))}
                </div>

                <div className="curso-icon"><FaBookOpen /></div>
                <strong>{curso.nombre}</strong>
                <span>
                  {curso.descripcion ? curso.descripcion.slice(0, 60) + "..." : "Sin descripción"}
                </span>
                <Link to={`/login`} className="curso-link">Ver más</Link>
              </li>
            ))
          ) : (
            <li>Cargando cursos...</li>
          )}
        </ul>
      </Container>

      <footer className="footer">
        <p>© DevRootDark 2026</p>
      </footer>
    </div>
  );
}

export default Inicio;
