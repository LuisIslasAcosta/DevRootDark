import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardList,
  FaEdit,
  FaExclamationTriangle,
  FaImage,
  FaLayerGroup,
  FaListUl,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrashAlt,
  FaUsers,
  FaVideo,
  FaCloudUploadAlt
} from "react-icons/fa";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import "../styles/Cursos.css";
import { API_URL } from "../../config";
import { degradadoCurso, portadaCurso, inicialesCurso, colorCalificacion, formatoPrecio } from "../../componentes/cursoVisual";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const cursoVacio = { nombre: "", descripcion: "", precio: "", imagenes: [], videos: [] };

const textoArchivos = (lista, singular, plural) =>
  lista.length === 0 ? `Ningún ${singular} seleccionado` : lista.length === 1 ? lista[0].name : `${lista.length} ${plural}`;

function ProfesorCursos() {
  const [cursos, setCursos] = useState([]);
  const [resumen, setResumen] = useState({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoCurso, setNuevoCurso] = useState(cursoVacio);
  const [claveArchivos, setClaveArchivos] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subiendo, setSubiendo] = useState(false);

  const [cursoEditando, setCursoEditando] = useState(null);
  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo, texto }

  const cargarCursos = () => {
    axios
      .get(`${API_URL}/mis_cursos`, { headers: encabezados() })
      .then((res) => setCursos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error al cargar cursos:", err))
      .finally(() => setCargando(false));

    axios
      .get(`${API_URL}/progreso/cursos/resumen`, { headers: encabezados() })
      .then((res) => setResumen(res.data?.cursos || {}))
      .catch(() => setResumen({}));
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? cursos.filter((c) => `${c.nombre} ${c.descripcion}`.toLowerCase().includes(q)) : cursos;
  }, [cursos, busqueda]);

  const totales = useMemo(() => {
    const valores = Object.values(resumen);
    return {
      alumnos: valores.reduce((s, r) => s + (r.inscritos || 0), 0),
      riesgo: valores.reduce((s, r) => s + (r.en_riesgo || 0), 0),
      pagos: valores.reduce((s, r) => s + (r.pagos_pendientes || 0), 0)
    };
  }, [resumen]);

  /* ---------- Crear ---------- */
  const crearCurso = () => {
    if (!nuevoCurso.nombre.trim()) {
      setAviso({ tipo: "error", texto: "El nombre del curso es obligatorio." });
      return;
    }
    const formData = new FormData();
    formData.append("nombre", nuevoCurso.nombre);
    formData.append("descripcion", nuevoCurso.descripcion);
    formData.append("precio", nuevoCurso.precio);
    nuevoCurso.imagenes.forEach((img) => formData.append("imagenes", img));
    nuevoCurso.videos.forEach((video) => formData.append("videos", video));

    setSubiendo(true);
    axios
      .post(`${API_URL}/cursos`, formData, {
        headers: encabezados(),
        onUploadProgress: (e) => e.total && setUploadProgress(Math.round((e.loaded * 100) / e.total))
      })
      .then(() => {
        setAviso({ tipo: "ok", texto: "Curso creado correctamente." });
        setNuevoCurso(cursoVacio);
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

  /* ---------- Editar ---------- */
  const guardarEdicion = () => {
    const formData = new FormData();
    formData.append("nombre", cursoEditando.nombre);
    formData.append("descripcion", cursoEditando.descripcion);
    formData.append("precio", cursoEditando.precio);
    axios
      .put(`${API_URL}/cursos/${cursoEditando.id}`, formData, { headers: encabezados() })
      .then(() => {
        setAviso({ tipo: "ok", texto: "Curso actualizado." });
        setCursoEditando(null);
        cargarCursos();
      })
      .catch((err) => {
        console.error("Error al actualizar curso:", err);
        setAviso({ tipo: "error", texto: "No se pudo actualizar el curso." });
      });
  };

  /* ---------- Eliminar ---------- */
  const confirmarEliminar = () => {
    const { id, nombre } = cursoAEliminar;
    fetch(`${API_URL}/cursos/${id}`, { method: "DELETE", headers: encabezados() })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar");
        setCursos((prev) => prev.filter((c) => c.id !== id));
        setAviso({ tipo: "ok", texto: `Curso "${nombre}" eliminado.` });
      })
      .catch((err) => {
        console.error("Error al eliminar curso:", err);
        setAviso({ tipo: "error", texto: "No se pudo eliminar el curso." });
      })
      .finally(() => setCursoAEliminar(null));
  };

  return (
    <div className="mc cp">
      {/* ================= ENCABEZADO ================= */}
      <header className="mc-hero mc-hero-profesor">
        <div>
          <span className="mc-hero-sub"><FaBookOpen /> Mis cursos</span>
          <h2>Tus cursos</h2>
          <p>Administra el contenido, revisa cómo van tus alumnos y crea nuevos cursos.</p>
        </div>
        <div className="mc-hero-cifras">
          <div><strong>{cursos.length}</strong><span>cursos</span></div>
          <div><strong>{totales.alumnos}</strong><span>alumnos</span></div>
          <div><strong>{totales.riesgo}</strong><span>en riesgo</span></div>
        </div>
      </header>

      <div className="cp-barra">
        <label className="cp-buscar">
          <FaSearch aria-hidden="true" />
          <input type="search" placeholder="Buscar en mis cursos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar curso" />
        </label>
        <button type="button" className="cv-btn" onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm}>
          {mostrarForm ? <><FaTimes /> Cerrar</> : <><FaPlus /> Nuevo curso</>}
        </button>
      </div>

      {aviso && <div className={`cp-aviso ${aviso.tipo}`} role="status">{aviso.texto}</div>}
      {totales.pagos > 0 && (
        <Link to="/profesor/pagos" className="cp-aviso cp-aviso-info">
          Tienes {totales.pagos} {totales.pagos === 1 ? "pago" : "pagos"} de inscripción por validar.
        </Link>
      )}

      {/* ================= NUEVO CURSO ================= */}
      {mostrarForm && (
        <form className="cp-form" onSubmit={(e) => e.preventDefault()}>
          <h3>Nuevo curso</h3>
          <div className="cp-form-grid">
            <label className="cp-campo cp-campo-ancho">
              <span>Nombre del curso</span>
              <input type="text" value={nuevoCurso.nombre} onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })} placeholder="Ej. Python desde cero" />
            </label>
            <label className="cp-campo">
              <span>Precio (0 = gratis)</span>
              <input type="number" min="0" value={nuevoCurso.precio} onChange={(e) => setNuevoCurso({ ...nuevoCurso, precio: e.target.value })} placeholder="0" />
            </label>
            <label className="cp-campo cp-campo-completo">
              <span>Descripción</span>
              <textarea rows={3} value={nuevoCurso.descripcion} onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })} placeholder="¿Qué aprenderán tus alumnos?" />
            </label>
            <label className="cp-subir">
              <FaImage />
              <span>Portada e imágenes</span>
              <small>{textoArchivos(nuevoCurso.imagenes, "archivo", "imágenes")}</small>
              <input key={`img-${claveArchivos}`} type="file" accept="image/*" multiple onChange={(e) => setNuevoCurso({ ...nuevoCurso, imagenes: Array.from(e.target.files) })} />
            </label>
            <label className="cp-subir">
              <FaVideo />
              <span>Videos</span>
              <small>{textoArchivos(nuevoCurso.videos, "archivo", "videos")}</small>
              <input key={`vid-${claveArchivos}`} type="file" accept="video/*" multiple onChange={(e) => setNuevoCurso({ ...nuevoCurso, videos: Array.from(e.target.files) })} />
            </label>
          </div>

          {subiendo && (
            <div className="cp-subida">
              <FaCloudUploadAlt />
              <div className="cc-barra"><span style={{ width: `${uploadProgress}%` }} /></div>
              <small>{uploadProgress}%</small>
            </div>
          )}

          <div className="cp-form-acciones">
            <button type="button" className="cv-btn cv-btn-suave" onClick={() => setMostrarForm(false)} disabled={subiendo}>Cancelar</button>
            <button type="button" className="cv-btn" onClick={crearCurso} disabled={subiendo}>{subiendo ? "Creando..." : "Crear curso"}</button>
          </div>
        </form>
      )}

      {/* ================= TARJETAS ================= */}
      {cargando ? (
        <div className="cc-grid">{[1, 2, 3].map((n) => <div key={n} className="cc-tarjeta cc-esqueleto" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="cv-vacio">
          <FaBookOpen />
          <p>{cursos.length === 0 ? "Aún no tienes cursos. Crea el primero con «Nuevo curso»." : "Ningún curso coincide con la búsqueda."}</p>
        </div>
      ) : (
        <div className="cc-grid cc-grid-ancho">
          {filtrados.map((curso) => {
            const r = resumen[curso.id] || {};
            const portada = portadaCurso(curso);
            return (
              <article key={curso.id} className="cc-tarjeta">
                <div className="cc-portada" style={portada ? undefined : { background: degradadoCurso(curso.nombre) }}>
                  {portada ? <img src={portada} alt="" loading="lazy" /> : <span className="cc-iniciales">{inicialesCurso(curso.nombre)}</span>}
                  <span className={`cc-precio${Number(curso.precio) > 0 ? "" : " gratis"}`}>{formatoPrecio(curso.precio)}</span>
                  {r.en_riesgo > 0 && (
                    <Link to="/profesor/seguimiento" className="cc-insignia cc-insignia-peligro">
                      <FaExclamationTriangle /> {r.en_riesgo} en riesgo
                    </Link>
                  )}
                </div>

                <div className="cc-cuerpo">
                  <h3>{curso.nombre}</h3>
                  {curso.descripcion && <p className="cc-descripcion">{curso.descripcion}</p>}

                  <div className="cc-metricas">
                    <div><strong>{r.inscritos ?? "—"}</strong><span>alumnos</span></div>
                    <div><strong>{r.lecciones ?? "—"}</strong><span>lecciones</span></div>
                    <div><strong>{r.examenes ?? "—"}</strong><span>exámenes</span></div>
                    <div>
                      <strong style={{ color: colorCalificacion(r.promedio) }}>{r.promedio !== null && r.promedio !== undefined ? `${Math.round(r.promedio)}%` : "—"}</strong>
                      <span>promedio</span>
                    </div>
                  </div>

                  {r.inscritos > 0 && (
                    <div className="cc-progreso">
                      <div className="cc-progreso-fila"><span>Avance promedio del grupo</span><strong>{Math.round(r.avance_promedio || 0)}%</strong></div>
                      <div className="cc-barra"><span style={{ width: `${r.avance_promedio || 0}%` }} /></div>
                    </div>
                  )}

                  <nav className="cc-accesos" aria-label={`Administrar ${curso.nombre}`}>
                    <Link to={`/profesor/cursos/${curso.id}/niveles`}><FaLayerGroup /> Niveles</Link>
                    <Link to={`/profesor/cursos/${curso.id}/lecciones`}><FaListUl /> Lecciones</Link>
                    <Link to={`/profesor/cursos/${curso.id}/examenes`}><FaClipboardList /> Exámenes</Link>
                    <Link to={`/profesor/cursos/${curso.id}/alumnos`}><FaUsers /> Alumnos</Link>
                  </nav>

                  <div className="cc-acciones">
                    <button type="button" className="cv-btn cv-btn-suave" onClick={() => setCursoEditando({ id: curso.id, nombre: curso.nombre, descripcion: curso.descripcion || "", precio: curso.precio ?? "" })}>
                      <FaEdit /> Editar
                    </button>
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

      {/* ================= MODAL EDITAR ================= */}
      {cursoEditando && (
        <div className="cp-modal-fondo" role="dialog" aria-modal="true" aria-labelledby="cp-editar-titulo">
          <form className="cp-modal" onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }}>
            <button type="button" className="cp-cerrar" onClick={() => setCursoEditando(null)} aria-label="Cerrar"><FaTimes /></button>
            <h3 id="cp-editar-titulo"><FaEdit /> Editar curso</h3>
            <label className="cp-campo">
              <span>Nombre</span>
              <input type="text" value={cursoEditando.nombre} onChange={(e) => setCursoEditando({ ...cursoEditando, nombre: e.target.value })} />
            </label>
            <label className="cp-campo">
              <span>Descripción</span>
              <textarea rows={3} value={cursoEditando.descripcion} onChange={(e) => setCursoEditando({ ...cursoEditando, descripcion: e.target.value })} />
            </label>
            <label className="cp-campo">
              <span>Precio</span>
              <input type="number" min="0" value={cursoEditando.precio} onChange={(e) => setCursoEditando({ ...cursoEditando, precio: e.target.value })} />
            </label>
            <div className="cp-form-acciones">
              <button type="button" className="cv-btn cv-btn-suave" onClick={() => setCursoEditando(null)}>Cancelar</button>
              <button type="submit" className="cv-btn">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL ELIMINAR ================= */}
      {cursoAEliminar && (
        <div className="cp-modal-fondo" role="dialog" aria-modal="true" aria-labelledby="cp-eliminar-titulo">
          <div className="cp-modal">
            <h3 id="cp-eliminar-titulo"><FaTrashAlt /> Eliminar curso</h3>
            <p>¿Seguro que quieres eliminar <strong>{cursoAEliminar.nombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="cp-form-acciones">
              <button type="button" className="cv-btn cv-btn-suave" onClick={() => setCursoAEliminar(null)}>Cancelar</button>
              <button type="button" className="cv-btn cv-btn-peligro" onClick={confirmarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfesorCursos;
