import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function MisCursosAlumno() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= LOAD USER =================
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      try {
        setUser(JSON.parse(usuarioGuardado));
      } catch {
        setUser(null);
      }
    }

    const syncUser = () => {
      const actualizado = localStorage.getItem("usuario");
      if (actualizado) {
        setUser(JSON.parse(actualizado));
      }
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // ================= LOAD ENROLLED COURSES =================
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const cursosRes = await axios.get("http://127.0.0.1:5000/api/cursos", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const insRes = await axios.get(
          `http://127.0.0.1:5000/api/inscripciones/alumno/${user.id}`
        );

        const idsInscritos = [...new Set(insRes.data.map(i => i.curso_id))];

        const cursosFiltrados = cursosRes.data.filter(curso =>
          idsInscritos.includes(curso.id)
        );

        setCursos(cursosFiltrados);

      } catch (error) {
        console.error("Error cargando cursos:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  return (
    <div>

      {/* HEADER */}
      <div className="dashboard-topbar">
        <h2>Mis Cursos</h2>
        <p>Estos son los cursos en los que estás inscrito.</p>
      </div>

      {/* LISTADO */}
      <div className="file-grid">
        {loading ? (
          <p>Cargando tus cursos...</p>
        ) : cursos.length === 0 ? (
          <p>No estás inscrito en ningún curso aún.</p>
        ) : (
          cursos.map(curso => (
            <div key={curso.id} className="curso-form-card">

              {curso.imagenes?.length > 0 && (
                <img
                  src={`http://127.0.0.1:5000/api/uploads/imagenes/${curso.imagenes[0]}`}
                  alt={curso.nombre}
                  className="curso-thumb"
                />
              )}

              <h3 className="curso-title">{curso.nombre}</h3>
              <p>{curso.descripcion}</p>

              {curso.duracion && <span>Duración: {curso.duracion}</span>}<br />
              {curso.profesor && <span>Profesor: {curso.profesor}</span>}<br />

              <button className="btn-modern" disabled>
                Inscrito
              </button>

              <Link 
                to={`/principal/cursos/${curso.id}`} 
                className="btn-modern" 
                style={{ marginTop: "10px" }}
              >
                Ver Curso
              </Link>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MisCursosAlumno;
