import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Table, Button } from "react-bootstrap";
import axios from "axios";
import { FaSignOutAlt, FaUserEdit } from "react-icons/fa";
import "../styles/ProfesorPanel.css";

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener usuario desde localStorage
  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // Sincronizar usuario si cambia en localStorage
  useEffect(() => {
    const syncUser = () => {
      const usuarioActualizado = localStorage.getItem("usuario");
      if (usuarioActualizado) {
        setUser(JSON.parse(usuarioActualizado));
      }
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // Estado para cursos, alumnos y exámenes
  const [cursos, setCursos] = useState([]);
  const [alumnos, setAlumnos] = useState({});
  const [examenes, setExamenes] = useState({});

  // Cargar cursos del profesor autenticado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Token no encontrado. Redirigiendo a login...");
      navigate("/login");
      return;
    }

    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Cursos recibidos:", res.data);
      setCursos(res.data);
    })
    .catch(err => {
      console.error("Error al cargar cursos:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    });
  }, [navigate]);

  const cargarAlumnos = (cursoId) => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}/alumnos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setAlumnos(prev => ({ ...prev, [cursoId]: res.data })))
    .catch(err => console.error("Error al cargar alumnos:", err));
  };

  const cargarExamenes = (cursoId) => {
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}/examenes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setExamenes(prev => ({ ...prev, [cursoId]: res.data })))
    .catch(err => console.error("Error al cargar exámenes:", err));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="profesor-layout">
      <aside className="profesor-sidebar">
        <div className="profesor-top">
          {user && (
            <div className="profile">
              <img
                src={user.foto_perfil
                  ? (user.foto_perfil.startsWith("data:image")
                      ? user.foto_perfil
                      : `data:image/png;base64,${user.foto_perfil}`)
                  : "/default-avatar.png"}
                alt="Foto de perfil"
                className="profile-pic"
              />
              <span className="profile-name">{user.nombre}</span>

              <div className="profile-actions">
                <button className="edit" onClick={() => navigate("/profesor/editar-perfil")}>
                  <FaUserEdit /> Editar
                </button>
                <button className="logout" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="brand">Panel del Profesor</div>
        <nav className="profesor-nav">
          <a className="profesor-link" onClick={() => navigate("/profesor")}>Inicio</a>
          <a className="profesor-link" onClick={() => navigate("/profesor/cursos")}>Mis Cursos</a>
          <a className="profesor-link" onClick={() => navigate("/profesor/examenes")}>Exámenes</a>
          <a className="profesor-link" onClick={() => navigate("/profesor/alumnos")}>Alumnos</a>
        </nav>
      </aside>

      <main className="profesor-main">
        {location.pathname === "/profesor" && (
          <>
            <h2 className="dashboard-title">Mis Cursos</h2>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Alumnos</th>
                  <th>Exámenes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cursos.length === 0 ? (
                  <tr><td colSpan="4">No hay cursos disponibles</td></tr>
                ) : (
                  cursos.map(curso => (
                    <tr key={curso.id || curso._id}>
                      <td>{curso.nombre}</td>
                      <td>
                        <Button onClick={() => cargarAlumnos(curso.id || curso._id)}>Ver alumnos</Button>
                        {alumnos[curso.id || curso._id] && (
                          <ul>
                            {alumnos[curso.id || curso._id].map(al => (
                              <li key={al.id}>{al.nombre} ({al.email})</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        <Button onClick={() => cargarExamenes(curso.id || curso._id)}>Ver exámenes</Button>
                        {examenes[curso.id || curso._id] && (
                          <ul>
                            {examenes[curso.id || curso._id].map(ex => (
                              <li key={ex.id}>{ex.titulo} - {ex.fecha}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        <Button variant="info" onClick={() => navigate(`/profesor/cursos/${curso.id || curso._id}/editar`)}>
                          Editar Curso
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export default ProfesorPanel;