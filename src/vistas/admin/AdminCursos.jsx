import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaSearch, FaPlus, FaTimes, FaEye, FaTrashAlt, FaBookOpen, FaImage, FaVideo, FaChalkboardTeacher, FaExclamationTriangle } from "react-icons/fa";
import "../styles/AdminVistas.css";
import "../styles/Cursos.css";
import { degradadoCurso, portadaCurso, inicialesCurso, colorCalificacion, formatoPrecio } from "../../componentes/cursoVisual";
import { API_URL } from "../../config";

const API = API_URL;

const cursoVacio = (usuario) => ({
  nombre: "",
  descripcion: "",
  profesor_id: usuario ? usuario.id : "",
  imagenes: [],
  videos: []
});

const textoArchivos = (lista) =>
  lista.length === 0
    ? "Ningún archivo seleccionado"
    : lista.length === 1
    ? lista[0].name
    : `${lista.length} archivos seleccionados`;

function AdminCursos() {
  const usuario = JSON.parse(localStorage.getItem("usuario")); // usuario autenticado
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoCurso, setNuevoCurso] = useState(() => cursoVacio(usuario));
  const [claveArchivos, setClaveArchivos] = useState(0); // reinicia los inputs de archivos
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subiendo, setSubiendo] = useState(false);

  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const [resumen, setResumen] = useState({}); // curso_id -> alumnos, lecciones, promedio...

  const cargarCursos = () => {
    fetch(`${API}/cursos`)
      .then((res) => {
        if (!res.ok) throw new Error("Error de servidor");
        return res.json();
      })
      .then((data) => {
        setCursos(data);
        setErrorCarga(false);
      })
      .catch((err) => {
        console.error("Error al cargar cursos:", err);
        setErrorCarga(true);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarCursos();
    axios
      .get(`${API}/progreso/cursos/resumen`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => setResumen(res.data?.cursos || {}))
      .catch(() => setResumen({}));
  }, []);

  const totales = useMemo(() => {
    const valores = Object.values(resumen);
    return {
      alumnos: valores.reduce((s, r) => s + (r.inscritos || 0), 0),
      profesores: new Set(cursos.map((c) => c.profesor).filter(Boolean)).size,
      riesgo: valores.reduce((s, r) => s + (r.en_riesgo || 0), 0)
    };
  }, [resumen, cursos]);

  // El aviso desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const cursosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return cursos;
    return cursos.filter((c) =>
      [c.nombre, c.profesor].filter(Boolean).some((campo) => String(campo).toLowerCase().includes(q))
    );
  }, [cursos, busqueda]);

  /* ---------- Crear ---------- */
  const crearCurso = () => {
    if (!nuevoCurso.nombre.trim() || !nuevoCurso.profesor_id) {
      setAviso({ tipo: "error", texto: "El nombre del curso y el profesor son obligatorios." });
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nuevoCurso.nombre);
    formData.append("descripcion", nuevoCurso.descripcion);
    formData.append("profesor", nuevoCurso.profesor_id); // se envía automáticamente

    nuevoCurso.imagenes.forEach((img) => formData.append("imagenes", img));
    nuevoCurso.videos.forEach((video) => formData.append("videos", video));

    setSubiendo(true);
    setUploadProgress(0);

    axios
      .post(`${API}/cursos`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}` // JWT
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      })
      .then(() => {
        setAviso({ tipo: "ok", texto: "Curso creado correctamente." });
        setNuevoCurso(cursoVacio(usuario));
        setClaveArchivos((k) => k + 1);
        setMostrarForm(false);
        cargarCursos();
      })
      .catch((err) => {
        console.error("Error al crear curso:", err);
        setAviso({ tipo: "error", texto: "No se pudo crear el curso. Revisa los datos e inténtalo de nuevo." });
      })
      .finally(() => {
        setSubiendo(false);
        setUploadProgress(0);
      });
  };

  /* ---------- Eliminar ---------- */
  const confirmarEliminar = () => {
    const { id, nombre } = cursoAEliminar;
    setEliminando(true);
    fetch(`${API}/cursos/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar");
        setCursos((prev) => prev.filter((c) => c.id !== id));
        setAviso({ tipo: "ok", texto: `Curso "${nombre}" eliminado.` });
      })
      .catch((err) => {
        console.error("Error al eliminar curso:", err);
        setAviso({ tipo: "error", texto: "No se pudo eliminar el curso. Inténtalo de nuevo." });
      })
      .finally(() => {
        setEliminando(false);
        setCursoAEliminar(null);
      });
  };

  return (
    <div className="admin-section">
      <header className="mc-hero mc-hero-admin">
        <div>
          <span className="mc-hero-sub"><FaBookOpen /> Catálogo</span>
          <h2>Gestión de cursos</h2>
          <p>{cargando ? "Cargando..." : `Mostrando ${cursosFiltrados.length} de ${cursos.length} cursos de la plataforma.`}</p>
        </div>
        <div className="mc-hero-cifras">
          <div><strong>{cursos.length}</strong><span>cursos</span></div>
          <div><strong>{totales.profesores}</strong><span>{totales.profesores === 1 ? "profesor" : "profesores"}</span></div>
          <div><strong>{totales.alumnos}</strong><span>{totales.alumnos === 1 ? "alumno inscrito" : "alumnos inscritos"}</span></div>
        </div>
      </header>

      <div className="av-header">
        <div className="av-tools">
          <label className="av-buscar">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por curso o profesor"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar cursos"
            />
          </label>
          <button
            type="button"
            className="av-btn av-btn--primario av-btn--nuevo"
            onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm}
          >
            {mostrarForm ? <FaTimes /> : <FaPlus />} {mostrarForm ? "Cerrar" : "Nuevo curso"}
          </button>
        </div>
      </div>

      {aviso && (
        <div className={`av-aviso ${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}

      {mostrarForm && (
        <form className="av-form" onSubmit={(e) => e.preventDefault()}>
          <h3>Nuevo curso</h3>
          <div className="av-form-grid">
            <label className="av-campo">
              <span>Nombre</span>
              <input
                type="text"
                value={nuevoCurso.nombre}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                placeholder="Ej. Introducción a Docker"
              />
            </label>

            <label className="av-campo av-campo--full">
              <span>Descripción</span>
              <textarea
                rows={3}
                value={nuevoCurso.descripcion}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                placeholder="¿De qué trata el curso?"
              />
            </label>

            <label className="av-campo">
              <span>Imágenes</span>
              <input
                key={`img-${claveArchivos}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })}
              />
              <small className="av-archivos">{textoArchivos(nuevoCurso.imagenes)}</small>
            </label>

            <label className="av-campo">
              <span>Videos</span>
              <input
                key={`vid-${claveArchivos}`}
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })}
              />
              <small className="av-archivos">{textoArchivos(nuevoCurso.videos)}</small>
            </label>
          </div>

          {subiendo && (
            <div className="av-progreso" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="av-progreso-barra" style={{ width: `${uploadProgress}%` }} />
              <span>Subiendo archivos… {uploadProgress}%</span>
            </div>
          )}

          <div className="av-form-acciones">
            <button
              type="button"
              className="av-btn av-btn--ghost"
              onClick={() => setMostrarForm(false)}
              disabled={subiendo}
            >
              Cancelar
            </button>
            <button type="button" className="av-btn av-btn--primario" onClick={crearCurso} disabled={subiendo}>
              {subiendo ? "Creando..." : "Crear curso"}
            </button>
          </div>
        </form>
      )}

      {errorCarga ? (
        <div className="av-vacio">
          <p>No se pudieron cargar los cursos. Revisa que el servidor esté activo y recarga la página.</p>
        </div>
      ) : !cargando && cursosFiltrados.length === 0 ? (
        <div className="av-vacio">
          <FaBookOpen aria-hidden="true" />
          <p>
            {cursos.length === 0
              ? "Aún no hay cursos. Crea el primero con el botón Nuevo curso."
              : "Ningún curso coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="cc-grid cc-grid-ancho">
          {cursosFiltrados.map((curso, index) => {
            const imagenes = curso.imagenes || [];
            const videos = curso.videos || [];
            const r = resumen[curso.id] || {};
            const portada = portadaCurso(curso);
            return (
              <article key={curso.id || index} className="cc-tarjeta">
                <div className="cc-portada" style={portada ? undefined : { background: degradadoCurso(curso.nombre) }}>
                  {portada ? <img src={portada} alt="" loading="lazy" /> : <span className="cc-iniciales">{inicialesCurso(curso.nombre)}</span>}
                  <span className={`cc-precio${Number(curso.precio) > 0 ? "" : " gratis"}`}>{formatoPrecio(curso.precio)}</span>
                  {r.en_riesgo > 0 && (
                    <span className="cc-insignia cc-insignia-peligro"><FaExclamationTriangle /> {r.en_riesgo} en riesgo</span>
                  )}
                </div>
                <div className="cc-cuerpo">
                  <h3>{curso.nombre}</h3>
                  <span className="cc-profesor"><FaChalkboardTeacher /> {curso.profesor || "Sin profesor"}</span>
                  {curso.descripcion && <p className="cc-descripcion">{curso.descripcion}</p>}
                  <div className="cc-metricas">
                    <div><strong>{r.inscritos ?? "—"}</strong><span>alumnos</span></div>
                    <div><strong>{r.lecciones ?? "—"}</strong><span>lecciones</span></div>
                    <div><strong>{r.examenes ?? "—"}</strong><span>exámenes</span></div>
                    <div>
                      <strong style={{ color: colorCalificacion(r.promedio) }}>
                        {r.promedio !== null && r.promedio !== undefined ? `${Math.round(r.promedio)}%` : "—"}
                      </strong>
                      <span>promedio</span>
                    </div>
                  </div>
                  <div className="cc-chips">
                    <span><FaImage /> {imagenes.length} {imagenes.length === 1 ? "imagen" : "imágenes"}</span>
                    <span><FaVideo /> {videos.length} {videos.length === 1 ? "video" : "videos"}</span>
                  </div>
                  <div className="cc-acciones">
                    <Link to={`/admin/curso/${curso.id}`} className="cv-btn">
                      <FaEye /> Ver curso
                    </Link>
                    <button type="button" className="cv-btn cv-btn-peligro-suave" onClick={() => setCursoAEliminar(curso)}>
                      <FaTrashAlt /> Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal: confirmar eliminación */}
      <Modal
        show={!!cursoAEliminar}
        onHide={() => !eliminando && setCursoAEliminar(null)}
        centered
        className="av-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Eliminar curso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cursoAEliminar && (
            <p>
              ¿Seguro que quieres eliminar el curso <strong>{cursoAEliminar.nombre}</strong>? Esta acción no se
              puede deshacer.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="av-btn av-btn--ghost"
            onClick={() => setCursoAEliminar(null)}
            disabled={eliminando}
          >
            Cancelar
          </button>
          <button type="button" className="av-btn av-btn--peligro" onClick={confirmarEliminar} disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminCursos;