import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/curso.css";

function LeccionesAlumno({ cursoId }) {
  const [niveles, setNiveles] = useState([]);
  const [lecciones, setLecciones] = useState({});
  const [expandedNivel, setExpandedNivel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cursoId) return;

    const token = localStorage.getItem("token");

    // Cargar niveles
    axios.get(`http://127.0.0.1:5000/api/niveles/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const nivelesData = res.data || [];
      setNiveles(nivelesData);

      // Cargar lecciones de cada nivel
      nivelesData.forEach(nivel => {
        axios.get(`http://127.0.0.1:5000/api/lecciones/nivel/${nivel.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(resL => {
          setLecciones(prev => ({ ...prev, [nivel.id]: resL.data || [] }));
        })
        .catch(err => console.error("Error cargando lecciones:", err));
      });
    })
    .catch(err => console.error("Error cargando niveles:", err))
    .finally(() => setLoading(false));
  }, [cursoId]);

  const toggleNivel = (nivelId) => {
    setExpandedNivel(expandedNivel === nivelId ? null : nivelId);
  };

  if (loading) return <p>Cargando niveles y lecciones...</p>;
  if (niveles.length === 0) return <p>No hay niveles disponibles.</p>;

  return (
    <div className="accordion-container">
      {niveles.map(nivel => (
        <div key={nivel.id} className="accordion-nivel">
          <div className="nivel-header" onClick={() => toggleNivel(nivel.id)}>
            <span>{nivel.nombre || nivel.titulo}</span>
            <span className="arrow">{expandedNivel === nivel.id ? "▲" : "▼"}</span>
          </div>

          {expandedNivel === nivel.id && (
            <div className="nivel-body">
              {lecciones[nivel.id]?.length === 0 ? (
                <p className="no-lecciones">No hay lecciones en este nivel</p>
              ) : (
                lecciones[nivel.id].map(leccion => (
                  <div key={leccion.id} className="leccion-item">
                    <span>{leccion.titulo}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LeccionesAlumno;
