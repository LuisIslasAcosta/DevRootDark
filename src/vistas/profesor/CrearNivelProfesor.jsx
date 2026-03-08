import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function CrearNivelesCurso() {
  const { id: cursoId } = useParams(); // Traemos el ID del curso desde la URL
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= CREAR NUEVO NIVEL =================
  const crearNivel = async () => {
    if (!titulo) {
      alert("Ingresa un título para el nivel ");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://127.0.0.1:5000/api/niveles",
        {
          curso_id: cursoId, // ⚡ Aquí usamos directamente el cursoId
          titulo
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      alert("Nivel creado ");
      setTitulo("");

      // Redirigir de vuelta a la lista de niveles del curso
      navigate(`/profesor/cursos/${cursoId}/niveles`);
    } catch (err) {
      console.error("Error al crear nivel:", err);
      alert("Error al crear nivel ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2> Crear nuevo nivel</h2>

      <div className="crear-nivel-form mt-3">
        <input
          type="text"
          placeholder="Título del nivel"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button
          className="btn btn-success"
          onClick={crearNivel}
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Nivel"}
        </button>
      </div>
    </div>
  );
}

export default CrearNivelesCurso;
