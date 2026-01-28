import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import '../publico/styles/inicio_prueba.css';
import '../temas/temas.css';

function Inicio() {
  const [cursos, setCursos] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    fetch('http://127.0.0.1:5000/api/cursos')
      .then(res => res.json())
      .then(data => setCursos(data))
      .catch(err => console.error("Error al cargar cursos:", err));
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // limpiar variables personalizadas al cambiar de tema
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

  return (
    <div className='Cuerpo-completo'>
      <header className="admin-header">
        <div className="brand">Plataforma de Cursos en Línea</div>
        <nav className="admin-nav">
          <Link className="admin-link" to="/">Inicio</Link>
          <Link className="admin-link" to="/login">Iniciar Sesión</Link>
          <Link className="admin-link" to="/register">Registrarse</Link>
        </nav>
        <div className="tema-dropdown">
          <button onClick={() => setShowCustomizer(!showCustomizer)}>Temas</button>
          {showCustomizer && (
            <div className="tema-menu">
              <h4>Seleccionar tema</h4>
              <button onClick={() => changeTheme("light")}>Claro</button>
              <button onClick={() => changeTheme("dark")}>Oscuro</button>
              <button onClick={() => changeTheme("blue")}>Azul</button>
              <button onClick={() => changeTheme("green")}>Verde</button>

              <h4>Personalizar</h4>
              <label>
                Fondo:
                <input type="color" name="--bg-color" onChange={handleCustomTheme} />
              </label>
              <label>
                Texto:
                <input type="color" name="--text-color" onChange={handleCustomTheme} />
              </label>
              <label>
                Tarjeta:
                <input type="color" name="--card-bg" onChange={handleCustomTheme} />
              </label>
              <label>
                Borde tarjeta:
                <input type="color" name="--card-border" onChange={handleCustomTheme} />
              </label>
              <label>
                Enlaces:
                <input type="color" name="--link-color" onChange={handleCustomTheme} />
              </label>
              <label>
                Hover enlaces:
                <input type="color" name="--link-hover" onChange={handleCustomTheme} />
              </label>
            </div>
          )}
        </div>
      </header>

      <Container className="cursos-1">
        <h2>Los cursos que están disponibles son los siguientes:</h2>
        <p>Vista previa de los cursos disponibles:</p>

        <ul className="cursos-completos">
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <li key={curso.id} className="curso-item">
                <strong>{curso.nombre}</strong><br />
                <span>{curso.descripcion.slice(0, 60)}...</span>
                <br />
                <Link to={`/login`} className="curso-link">Ver más</Link>
              </li>
            ))
          ) : (
            <>
              <li className="curso-item">Curso de React — Aprende a construir aplicaciones web modernas...</li>
              <li className="curso-item">Curso de Node.js — Domina el backend con Express y MongoDB...</li>
              <li className="curso-item">Curso de Python — Explora Python desde cero...</li>
            </>
          )}
        </ul>

        <div className="politicas-link">
          <Link to="/politicas">Ver políticas</Link>
        </div>
      </Container>
    </div>
  );
}

export default Inicio;