import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/CursosExistentes.css";

function ProfesorCursos() {

  const [cursos, setCursos] = useState([]);

  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    imagenes: [],
    videos: []
  });

  const [cursoEditando, setCursoEditando] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);

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
    formData.append("precio", nuevoCurso.precio);

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

      setNuevoCurso({
        nombre:"",
        descripcion:"",
        precio:"",
        imagenes:[],
        videos:[]
      });

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


  const editarCurso = (curso) => {

    setCursoEditando({
      id: curso.id,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      precio: curso.precio
    });

  };


  const guardarEdicion = () => {

    const formData = new FormData();

    formData.append("nombre", cursoEditando.nombre);
    formData.append("descripcion", cursoEditando.descripcion);
    formData.append("precio", cursoEditando.precio);

    axios.put(
      `http://127.0.0.1:5000/api/cursos/${cursoEditando.id}`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }
    )
    .then(() => {

      alert("Curso actualizado");

      setCursoEditando(null);

      cargarCursos();

    })
    .catch(err => console.error("Error al actualizar curso:", err));

  };


  return (

    <div className="admin-section">

      <h2>Mis Cursos</h2>


      <form className="curso-form" onSubmit={e => e.preventDefault()}>

        <div className="form-group">
          <label>Nombre</label>
          <input type="text" value={nuevoCurso.nombre} onChange={e => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}/>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <input type="text" value={nuevoCurso.descripcion} onChange={e => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}/>
        </div>

        <div className="form-group">
          <label>Precio</label>
          <input type="number" value={nuevoCurso.precio} onChange={e => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })}/>
        </div>

        <div className="form-group">
          <label>Imágenes</label>
          <input type="file" accept="image/*" multiple onChange={e => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })}/>
        </div>

        <div className="form-group">
          <label>Videos</label>
          <input type="file" accept="video/*" multiple onChange={e => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })}/>
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
            <th>Precio</th>
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

              <td>${curso.precio}</td>

              <td>{curso.profesor}</td>


              <td>

                {curso.imagenes && curso.imagenes.map((img, i) => (

                  <img
                    key={i}
                    src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                    alt="curso"
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
                  />

                ))}

              </td>


              <td>

                <Link to={`/profesor/curso/${curso.id}`}>
                  <button className="custom-btn btn-ver">Ver</button>
                </Link>

                <button
                  className="custom-btn"
                  style={{marginLeft:"5px"}}
                  onClick={()=>editarCurso(curso)}
                >
                  Editar
                </button>

                <button
                  className="custom-btn btn-eliminar"
                  onClick={()=>eliminarCurso(curso.id)}
                  style={{marginLeft:"5px"}}
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>


      {cursoEditando && (

        <div className="edit-panel">

          <h3>Editar Curso</h3>

          <input type="text" value={cursoEditando.nombre} onChange={e=>setCursoEditando({...cursoEditando,nombre:e.target.value})}/>

          <input type="text" value={cursoEditando.descripcion} onChange={e=>setCursoEditando({...cursoEditando,descripcion:e.target.value})}/>

          <input type="number" value={cursoEditando.precio} onChange={e=>setCursoEditando({...cursoEditando,precio:e.target.value})}/>

          <button className="custom-btn btn-ver" onClick={guardarEdicion}>
            Guardar
          </button>

        </div>

      )}

    </div>

  );

}

export default ProfesorCursos;