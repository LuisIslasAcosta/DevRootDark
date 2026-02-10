import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function MisCursosAlumno() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Sincroniza usuario con storage
  useEffect(() => {
    const syncUser = () => {
      const usuarioActualizado = localStorage.getItem("usuario");
      if (usuarioActualizado) setUser(JSON.parse(usuarioActualizado));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // 🔹 Cargar SOLO cursos inscritos
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener todos los cursos
        const cursosRes = await axios.get("http://127.0.0.1:5000/api/cursos", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Obtener inscripciones del alumno
        const insRes = await axios.get(
          `http://127.0.0.1:5000/api/inscripciones/alumno/${user?.id}`
        );

        const idsInscritos = insRes.data.map(i => i.curso_id);

        // ✅ Filtrar SOLO cursos inscritos
        const cursosFiltrados = cursosRes.data.filter(c =>
          idsInscritos.includes(c.id)
        );

        setCursos(cursosFiltrados);
      } catch (err) {
        console.error("Error cargando cursos:", err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, navigate]);

  return (
    <div>
      <div className="dashboard-topbar">
        <h2>Mis Cursos</h2>
        <p>Estos son los cursos en los que estás inscrito.</p>
      </div>

      <div className="file-grid">
        {loading ? (
          <p>Cargando tus cursos...</p>
        ) : cursos.length === 0 ? (
          <p>No estás inscrito en ningún curso aún.</p>
        ) : (
          cursos.map(curso => (
            <div key={curso.id} className="curso-form-card">

              {/* IMÁGENES */}
              {curso.imagenes && curso.imagenes.map((img, i) => (
                <img
                  key={i}
                  src={`http://127.0.0.1:5000/api/uploads/imagenes/${img}`}
                  alt={`Imagen ${i+1} del curso ${curso.nombre}`}
                  className="curso-thumb"
                />
              ))}

              <h3 className="curso-title">{curso.nombre}</h3>
              <p>{curso.descripcion}</p>
              <span>{curso.duracion && `Duración: ${curso.duracion}`}</span><br />
              <span>{curso.profesor && `Profesor: ${curso.profesor}`}</span><br />

              {/* Estado fijo */}
              <button className="btn-modern" disabled>
                Inscrito
              </button>

              {/* VER CURSO DENTRO DEL PANEL */}
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
