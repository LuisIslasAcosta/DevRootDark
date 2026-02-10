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
    profesor: ""
  });

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      const cursoRecibido = res.data;
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      setCurso({ ...cursoRecibido, profesor: usuario.id });
    })
    .catch(err => console.error("Error al cargar curso:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:5000/api/cursos/${id}`, curso, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Curso actualizado correctamente ✅");
      navigate("/profesor/cursos");
    } catch (err) {
      console.error("Error al actualizar curso:", err);
      alert("Error al actualizar curso ❌");
    }
  };

  return (
    <div className="editar-section">
      <h2>Editar Curso</h2>
      <form className="editar-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={curso.nombre}
            onChange={handleChange}
          />
        </div>
        <br />
        <div className="form-group">
          <label>Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={curso.descripcion}
            onChange={handleChange}
          />
        </div>
        <br /><br />
        <button type="submit" className="custom-btn btn-guardar">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

export default EditarCursoProfesor;
