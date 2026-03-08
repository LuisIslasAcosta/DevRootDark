import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import '../styles/CrearLeccionProfesor.css'

function CrearLeccionProfesor() {
  const { id } = useParams();
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [nivel, setNivel] = useState("");
  const [niveles, setNiveles] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cursoId = id;

  useEffect(() => {
    if (!cursoId) return;
    const token = localStorage.getItem("token");
    axios.get(`http://127.0.0.1:5000/api/niveles/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setNiveles(res.data || []);
      setNivel("");
    })
    .catch(err => console.error("Error cargando niveles:", err));
  }, [cursoId]);

  const guardar = async () => {
    if (!cursoId || !titulo || !nivel) {
      alert("Completa todos los campos obligatorios ");
      return;
    }

    const formData = new FormData();
    formData.append("curso_id", cursoId);
    formData.append("titulo", titulo);
    formData.append("contenido", contenido);
    formData.append("nivel_id", nivel);

    archivos.forEach(file => formData.append("archivos", file));

    try {
      setLoading(true);
      await axios.post("http://127.0.0.1:5000/api/lecciones", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Lección creada ");

      // Limpiar campos
      setTitulo("");
      setContenido("");
      setNivel("");
      setArchivos([]);
    } catch (error) {
      console.error("Error guardando lección:", error);
      alert("Error al crear la lección ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-form">
      <h3>Crear Lección</h3>

      <label>Nivel</label>
      <select value={nivel} onChange={e => setNivel(e.target.value)} disabled={!cursoId}>
        <option value="">{cursoId ? "Selecciona un nivel" : "Curso no válido"}</option>
        {niveles.map(n => (
          <option key={n.id} value={n.id}>{n.titulo || n.nombre}</option>
        ))}
      </select>

      <label>Título</label>
      <input placeholder="Título de la lección" value={titulo} onChange={e => setTitulo(e.target.value)} />

      <label>Contenido</label>
      <textarea placeholder="Contenido de la lección" value={contenido} onChange={e => setContenido(e.target.value)} />

      <label>Archivos (imágenes, videos, PDF)</label>
      <input type="file" multiple onChange={e => setArchivos(Array.from(e.target.files))} />

      <button onClick={guardar} disabled={loading}>
        {loading ? "Guardando..." : "Guardar Lección"}
      </button>
    </div>
  );
}

export default CrearLeccionProfesor;
