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
  const [mostrarCrear, setMostrarCrear] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const cargarCursos = () => {
    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setCursos(res.data))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const crearCurso = () => {

    if (!nuevoCurso.nombre) {
      alert("El nombre es obligatorio");
      return;
    }

    const formData = new FormData();

    formData.append("nombre", nuevoCurso.nombre);
    formData.append("descripcion", nuevoCurso.descripcion);
    formData.append("precio", nuevoCurso.precio);

    nuevoCurso.imagenes.forEach(img => formData.append("imagenes", img));
    nuevoCurso.videos.forEach(v => formData.append("videos", v));

    axios.post("http://127.0.0.1:5000/api/cursos", formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(percent);
      }
    })
    .then(() => {
      alert("Curso creado");
      setUploadProgress(0);
      setMostrarCrear(false);

      setNuevoCurso({
        nombre:"",
        descripcion:"",
        precio:"",
        imagenes:[],
        videos:[]
      });

      cargarCursos();
    })
    .catch(err => console.error(err));
  };

  const eliminarCurso = (id) => {
    if (!window.confirm("¿Eliminar?")) return;

    fetch(`http://127.0.0.1:5000/api/cursos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(() => setCursos(cursos.filter(c => c.id !== id)))
    .catch(err => console.error(err));
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
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
    .then(() => {
      alert("Actualizado");
      setCursoEditando(null);
      cargarCursos();
    })
    .catch(err => console.error(err));
  };

  return (
    <div className="admin-section">

      <h2>Mis Cursos</h2>

      {/* 🔥 BOTÓN CREAR */}
      <div style={{textAlign:"center", marginBottom:"20px"}}>
        <button className="custom-btn btn-crear" onClick={()=>setMostrarCrear(true)}>
          + Crear Curso
        </button>
      </div>

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
          {cursos.map((curso) => (
            <tr key={curso.id}>
              <td>{curso.nombre}</td>
              <td>${curso.precio}</td>
              <td>{curso.profesor}</td>

              <td>
                {curso.imagenes?.map((img, i) => (
                  <img key={i} src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`} className="curso-img" />
                ))}
              </td>

              <td>
                {curso.videos?.map((vid, i) => (
                  <video key={i} src={`http://127.0.0.1:5000/api/uploads/videos/${vid}`} controls className="curso-video" />
                ))}
              </td>

              <td>
                <div className="acciones-btns">

                  <Link to={`/profesor/curso/${curso.id}`}>
                    <button className="custom-btn btn-ver">Ver</button>
                  </Link>

                  <button className="custom-btn" onClick={()=>editarCurso(curso)}>
                    Editar
                  </button>

                  <button className="custom-btn btn-eliminarc" onClick={()=>eliminarCurso(curso.id)}>
                    Eliminar
                  </button>

                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 MODAL CREAR */}
      {mostrarCrear && (
        <div className="modal-overlay" onClick={()=>setMostrarCrear(false)}>
          <div className="edit-panel" onClick={(e)=>e.stopPropagation()}>

            <h3>Crear Curso</h3>

            <input type="text" placeholder="Nombre" value={nuevoCurso.nombre} onChange={e => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}/>
            <input type="text" placeholder="Descripción" value={nuevoCurso.descripcion} onChange={e => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}/>
            <input type="number" placeholder="Precio" value={nuevoCurso.precio} onChange={e => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })}/>
            <input type="file" multiple onChange={e => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })}/>
            <input type="file" multiple onChange={e => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })}/>

            <div className="modal-actions">
              <button className="custom-btn btn-crear" onClick={crearCurso}>Crear</button>
              <button className="custom-btn btn-eliminarc" onClick={()=>setMostrarCrear(false)}>Cancelar</button>
            </div>

          </div>
        </div>
      )}

      {/* 🔥 MODAL EDITAR */}
      {cursoEditando && (
        <div className="modal-overlay" onClick={()=>setCursoEditando(null)}>
          <div className="edit-panel" onClick={(e)=>e.stopPropagation()}>

            <h3>Editar Curso</h3>

            <input type="text" value={cursoEditando.nombre} onChange={e=>setCursoEditando({...cursoEditando,nombre:e.target.value})}/>
            <input type="text" value={cursoEditando.descripcion} onChange={e=>setCursoEditando({...cursoEditando,descripcion:e.target.value})}/>
            <input type="number" value={cursoEditando.precio} onChange={e=>setCursoEditando({...cursoEditando,precio:e.target.value})}/>

            <div className="modal-actions">
              <button className="custom-btn btn-ver" onClick={guardarEdicion}>Guardar</button>
              <button className="custom-btn btn-eliminarc" onClick={()=>setCursoEditando(null)}>Cancelar</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ProfesorCursos;