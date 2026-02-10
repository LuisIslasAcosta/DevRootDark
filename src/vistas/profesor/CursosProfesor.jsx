import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/CursosExistentes.css";

function ProfesorCursos() {
  const [cursos, setCursos] = useState([]);
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: "",
    descripcion: "",
    imagenes: [],
    videos: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  // 🔹 Cargar solo los cursos del profesor autenticado
  const cargarCursos = () => {
    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setCursos(res.data))
    .catch(err => console.error("Error al cargar cursos:", err));
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const crearCurso = () => {
    if (!nuevoCurso.nombre) {
      alert("El nombre del curso es obligatorio");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nuevoCurso.nombre);
    formData.append("descripcion", nuevoCurso.descripcion);

    nuevoCurso.imagenes.forEach(img => {
      formData.append("imagenes", img);
    });

    nuevoCurso.videos.forEach(video => {
      formData.append("videos", video);
    });

    axios.post("http://127.0.0.1:5000/api/cursos", formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    })
    .then(() => {
      alert("Curso creado correctamente");
      setUploadProgress(0);
      cargarCursos();
    })
    .catch(err => console.error("Error al crear curso:", err));
  };

  const eliminarCurso = (id) => {
    const confirmar = window.confirm("¿Estás seguro de que quieres eliminar este curso?");
    if (!confirmar) return;

    fetch(`http://127.0.0.1:5000/api/cursos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(() => {
        alert("Curso eliminado");
        setCursos(cursos.filter(c => c.id !== id));
      })
      .catch(err => console.error("Error al eliminar curso:", err));
  };

  return (
    <div className="admin-section">
      <h2>Mis Cursos</h2>

      <form className="curso-form" onSubmit={e => e.preventDefault()}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={nuevoCurso.nombre}
            onChange={e => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <input
            type="text"
            value={nuevoCurso.descripcion}
            onChange={e => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Imágenes</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })}
          />
        </div>
        <div className="form-group">
          <label>Videos</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={e => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })}
          />
        </div>
        <button className="custom-btn btn-crear" onClick={crearCurso}>
          Crear Curso
        </button>
      </form>

      {uploadProgress > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}

      <h3>Mis cursos existentes</h3>
      <table className="admin-table">
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
                    className="curso-img"
                  />
                ))}
              </td>
              <td>
                {curso.videos && curso.videos.map((vid, i) => (
                  <video
                    key={i}
                    src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`}
                    controls
                    className="curso-video"
                  >
                    Tu navegador no soporta video
                  </video>
                ))}
              </td>
              <td>
                <Link to={`/profesor/curso/${curso.id}`}>
                  <button className="custom-btn btn-ver">Ver</button>
                </Link>
                <button
                  className="custom-btn btn-eliminar"
                  onClick={() => eliminarCurso(curso.id)}
                  style={{ marginLeft: "5px" }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProfesorCursos;
