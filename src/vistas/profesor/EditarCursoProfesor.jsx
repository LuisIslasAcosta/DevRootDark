import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/EditarCursoProfesor.css";

function EditarCursoProfesor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState({
    nombre: "",
    descripcion: "",
    imagenes: [],
    videos: [],
    profesor: "",
    imagenesFiles: [],
    videosFiles: []
  });

  const [imagenesEliminar, setImagenesEliminar] = useState([]);
  const [videosEliminar, setVideosEliminar] = useState([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      const cursoRecibido = res.data;
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      setCurso({
        ...cursoRecibido,
        profesor: usuario.id,
        imagenesFiles: [],
        videosFiles: []
      });
    })
    .catch(err => console.error("Error al cargar curso:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  //  eliminar imagen existente
  const eliminarImagenExistente = (img) => {
    setImagenesEliminar(prev => [...prev, img]);
    setCurso(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter(i => i !== img)
    }));
  };

  //  eliminar video existente
  const eliminarVideoExistente = (vid) => {
    setVideosEliminar(prev => [...prev, vid]);
    setCurso(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v !== vid)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nombre", curso.nombre);
    formData.append("descripcion", curso.descripcion);

    // nuevas imágenes
    curso.imagenesFiles.forEach(img => formData.append("imagenes", img));

    // nuevos videos
    curso.videosFiles.forEach(vid => formData.append("videos", vid));

    // eliminados
    formData.append("imagenesEliminar", JSON.stringify(imagenesEliminar));
    formData.append("videosEliminar", JSON.stringify(videosEliminar));

    try {
      await axios.put(`http://127.0.0.1:5000/api/cursos/${id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      alert("Curso actualizado correctamente ");
      navigate("/profesor/cursos");

    } catch (err) {
      console.error(err);
      alert("Error al actualizar ");
    }
  };

  return (
    <div className="editar-section">
      <h2>Editar Curso</h2>

      <form className="editar-form" onSubmit={handleSubmit}>

        {/* Nombre */}
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={curso.nombre}
            onChange={handleChange}
          />
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label>Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={curso.descripcion}
            onChange={handleChange}
          />
        </div>

        {/* IMÁGENES EXISTENTES */}
        {curso.imagenes?.length > 0 && (
          <div className="form-group">
            <label>Imágenes actuales</label>

            <div className="preview-grid">
              {curso.imagenes.map((img, index) => (
                <div key={index} className="preview-item">
                  <img
                    src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                    alt="Imagen curso"
                    className="preview-img"
                  />

                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => eliminarImagenExistente(img)}
                  >
                     Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEOS EXISTENTES */}
        {curso.videos?.length > 0 && (
          <div className="form-group">
            <label>Videos actuales</label>

            <div className="preview-grid">
              {curso.videos.map((vid, index) => (
                <div key={index} className="preview-item">
                  <video
                    src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`}
                    controls
                    className="preview-video"
                  />

                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => eliminarVideoExistente(vid)}
                  >
                     Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBIR NUEVOS */}
        <div className="form-group">
          <label>Nuevas imágenes</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => setCurso({ ...curso, imagenesFiles: Array.from(e.target.files) })}
          />
        </div>

        <div className="form-group">
          <label>Nuevos videos</label>
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={e => setCurso({ ...curso, videosFiles: Array.from(e.target.files) })}
          />
        </div>

        <button type="submit" className="custom-btn btn-guardar">
          Guardar cambios
        </button>

      </form>
    </div>
  );
}

export default EditarCursoProfesor;
