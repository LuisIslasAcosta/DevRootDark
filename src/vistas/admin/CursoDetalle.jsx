import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import '../styles/Curso_Detalle.css'

function CursoDetalle() {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/cursos/${id}`)
      .then(res => res.json())
      .then(data => setCurso(data))
      .catch(err => console.error("Error al cargar curso:", err));
  }, [id]);

  if (!curso) return <p>Cargando curso...</p>;

  return (
    <div className="curso-detalle">
      <h2>{curso.nombre}</h2>
      <p><strong>Profesor:</strong> {curso.profesor}</p>
      <p><strong>Descripción:</strong> {curso.descripcion}</p>

      <h4>Imágenes</h4>
      <div>
        {curso.imagenes && curso.imagenes.map((img, i) => (
          <img
            key={i}
            src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
            alt={`Imagen ${i + 1}`}
            style={{ width: "120px", marginRight: "10px" }}
          />
        ))}
      </div>

      <h4>Videos</h4>
      <div>
        {curso.videos && curso.videos.map((vid, i) => (
          <video
            key={i}
            src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`}
            controls
            width="300"
            style={{ marginRight: "10px" }}
          />
        ))}
      </div>

      <Link to="/admin/cursos">
        <Button variant="secondary" style={{ marginTop: "20px" }}>
          Volver
        </Button>
      </Link>
    </div>
  );
}

export default CursoDetalle;