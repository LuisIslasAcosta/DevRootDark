import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function EditarCursoProfesor() {
  const { id } = useParams(); // id del curso desde la URL
  const navigate = useNavigate();

  const [curso, setCurso] = useState({
    nombre: "",
    descripcion: "",
    imagenes: [],
    videos: [],
    profesor: "" // 👈 añadimos profesor
  });

  // Cargar datos del curso
  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      const cursoRecibido = res.data;
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      // 👇 aseguramos que el curso mantenga el profesor correcto
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
      navigate("/profesor/cursos"); // regresa a la lista de cursos
    } catch (err) {
      console.error("Error al actualizar curso:", err); // 👈 usamos la variable
      alert("Error al actualizar curso ❌");
    }
  };

  return (
    <div>
      <h2>Editar Curso</h2>
      <form onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input
          type="text"
          name="nombre"
          value={curso.nombre}
          onChange={handleChange}
        />

        <label>Descripción</label>
        <input
          type="text"
          name="descripcion"
          value={curso.descripcion}
          onChange={handleChange}
        />

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

export default EditarCursoProfesor;