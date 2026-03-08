import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function VerNivelesProfesor() {
  const { id: cursoId } = useParams(); // Traemos el id del curso desde la URL
  const navigate = useNavigate();
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= CARGAR NIVELES =================
  useEffect(() => {
    const fetchNiveles = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://127.0.0.1:5000/api/niveles/curso/${cursoId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setNiveles(res.data || []);
      } catch (err) {
        console.error("Error al cargar niveles:", err);
        alert("Error cargando niveles ");
      } finally {
        setLoading(false);
      }
    };

    fetchNiveles();
  }, [cursoId]);

  // ================= ELIMINAR NIVEL =================
  const eliminarNivel = async (id) => {
    if (!window.confirm("¿Eliminar este nivel?")) return;

    try {
      await axios.delete(`http://127.0.0.1:5000/api/niveles/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setNiveles(prev => prev.filter(n => n.id !== id));
      alert("Nivel eliminado ");
    } catch (err) {
      console.error("Error al eliminar nivel:", err);
      alert("Error al eliminar ");
    }
  };

  if (loading) return <p>Cargando niveles...</p>;

  return (
    <div className="container mt-4">
      <h2> Niveles del curso</h2>

      <button
        className="btn btn-success mb-3"
        onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles/crear`)}
      >
         Crear nuevo nivel
      </button>

      {niveles.length === 0 && <p>No hay niveles aún.</p>}

      {niveles.map(nivel => (
        <div key={nivel.id} className="card mb-3 p-3">
          <h5>{nivel.titulo}</h5>
          <p>{nivel.contenido}</p>

          <div className="d-flex gap-2 mt-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles/${nivel.id}/editar`)}
            >
               Editar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => eliminarNivel(nivel.id)}
            >
               Eliminar
            </button>
            <button
              className="btn btn-info"
              onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles/${nivel.id}/lecciones`)}
            >
               Ver Lecciones
            </button>
            <button
              className="btn btn-warning"
              onClick={() => navigate(`/profesor/cursos/${cursoId}/niveles/${nivel.id}/examenes`)}
            >
               Ver Exámenes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VerNivelesProfesor;