import React, { useEffect, useState } from "react";
import { Table, Button, Form, ProgressBar } from "react-bootstrap";
import axios from "axios";
import '../styles/AdminVistas.css';
import { Link } from "react-router-dom";

function AdminCursos() {
  const [cursos, setCursos] = useState([]);
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: "",
    descripcion: "",
    profesor: "",
    fecha_inicio: "",
    fecha_fin: "",
    imagenes: [],
    videos: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const cargarCursos = () => {
    fetch("http://127.0.0.1:5000/api/cursos")
      .then(res => res.json())
      .then(data => setCursos(data))
      .catch(err => console.error("Error al cargar cursos:", err));
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const crearCurso = () => {
    if (!nuevoCurso.nombre || !nuevoCurso.profesor) {
      alert("Nombre y profesor son obligatorios");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nuevoCurso.nombre);
    formData.append("descripcion", nuevoCurso.descripcion);
    formData.append("profesor", nuevoCurso.profesor);
    formData.append("fecha_inicio", nuevoCurso.fecha_inicio);
    formData.append("fecha_fin", nuevoCurso.fecha_fin);

    nuevoCurso.imagenes.forEach(img => {
      formData.append("imagenes", img);
    });

    nuevoCurso.videos.forEach(video => {
      formData.append("videos", video);
    });

    axios.post("http://127.0.0.1:5000/api/cursos", formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    })
    .then(() => {
      alert("Curso creado correctamente");
      setUploadProgress(0); // reinicia barra
      cargarCursos();
    })
    .catch(err => console.error("Error al crear curso:", err));
  };

  const eliminarCurso = (id) => {
    fetch(`http://127.0.0.1:5000/api/cursos/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        alert("Curso eliminado");
        setCursos(cursos.filter(c => c.id !== id));
      })
      .catch(err => console.error("Error al eliminar curso:", err));
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Cursos</h2>
      <Form className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            value={nuevoCurso.nombre}
            onChange={e => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            type="text"
            value={nuevoCurso.descripcion}
            onChange={e => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Profesor</Form.Label>
          <Form.Control
            type="text"
            value={nuevoCurso.profesor}
            onChange={e => setNuevoCurso({ ...nuevoCurso, profesor: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Imágenes</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            multiple
            onChange={e => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Videos</Form.Label>
          <Form.Control
            type="file"
            accept="video/*"
            multiple
            onChange={e => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })}
          />
        </Form.Group>
        <Button variant="primary" onClick={crearCurso}>Crear Curso</Button>
      </Form>

      {uploadProgress > 0 && (
        <div style={{ marginTop: "15px" }}>
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
        </div>
      )}

      <h3>Cursos existentes</h3>
      <Table striped bordered hover className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Imágenes</th>
            <th>Videos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((curso, index) => (
            <tr key={curso.id || index}>
              <td>{curso.nombre}</td>
              <td>{curso.profesor}</td>
              <td>
                {curso.imagenes && curso.imagenes.map((img, i) => (
                  <img
                    key={i}
                    src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                    alt={`Imagen ${i+1} del curso ${curso.nombre}`}
                    style={{ width: "80px", marginRight: "5px" }}
                  />
                ))}
              </td>
              <td>
                {curso.videos && curso.videos.map((vid, i) => (
                  <video
                    key={i}
                    src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`}
                    controls
                    width="150"
                    style={{ marginRight: "5px" }}
                  >
                    Tu navegador no soporta video
                  </video>
                ))}
              </td>
              <td>
                <Link to={`/admin/curso/${curso.id}`}>
                  <Button variant="info" style={{ marginRight: "5px" }}>
                    Ver
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={() => eliminarCurso(curso.id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default AdminCursos;