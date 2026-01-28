import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import "../styles/curso.css";
import "../../temas/temas.css";

function Cursos() {
  const { id } = useParams(); // 🔹 obtiene el id de la URL
  const [curso, setCurso] = useState(null);
  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    // 🔹 Llamada al backend para obtener un curso específico
    fetch(`http://127.0.0.1:5000/api/cursos/${id}`)
      .then((res) => res.json())
      .then((data) => setCurso(data))
      .catch((err) => console.error("Error al cargar curso:", err));
  }, [id, theme]);

  if (!curso) {
    return <p>Cargando curso...</p>;
  }

  return (
    <div className="curso-detalle">
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">Plataforma de Cursos en Línea</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/principal">Volver a cursos</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="curso-info">
        <h2>{curso.nombre}</h2>
        <p><b>Descripción:</b> {curso.descripcion}</p>
        {curso.duracion && <p><b>Duración:</b> {curso.duracion}</p>}
        {curso.profesor && <p><b>Profesor:</b> {curso.profesor}</p>}
        {curso.fecha_inicio && <p><b>Fecha de inicio:</b> {curso.fecha_inicio}</p>}
        {curso.fecha_fin && <p><b>Fecha de fin:</b> {curso.fecha_fin}</p>}

        {/* Mostrar imágenes */}
        {curso.imagenes && curso.imagenes.length > 0 && (
          <div className="curso-imagenes">
            <h4>Imágenes del curso:</h4>
            {curso.imagenes.map((img, i) => (
              <img key={i} src={img} alt={`imagen-${i}`} style={{ width: "200px", marginRight: "10px" }} />
            ))}
          </div>
        )}

        {/* Mostrar videos */}
        {curso.videos && curso.videos.length > 0 && (
          <div className="curso-videos">
            <h4>Videos del curso:</h4>
            {curso.videos.map((vid, i) => (
              <div key={i} style={{ marginBottom: "15px" }}>
                {/* Si es YouTube, embebemos */}
                {vid.includes("youtube.com/watch") ? (
                  <iframe
                    width="400"
                    height="225"
                    src={vid.replace("watch?v=", "embed/")}
                    title={`video-${i}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <a href={vid} target="_blank" rel="noopener noreferrer">Ver video {i + 1}</a>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export default Cursos;