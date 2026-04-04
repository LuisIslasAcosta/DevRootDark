import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Examenes.css";

function VerExamenes() {
  const { cursoId } = useParams();

  const [cursoNombre, setCursoNombre] = useState("");
  const [examenes, setExamenes] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [lecciones, setLecciones] = useState([]);

  const [mostrarNiveles, setMostrarNiveles] = useState(false);
  const [mostrarLecciones, setMostrarLecciones] = useState(false);

  const [mostrarModalExamen, setMostrarModalExamen] = useState(false);
  const [mostrarModalNivel, setMostrarModalNivel] = useState(false);
  const [mostrarModalLeccion, setMostrarModalLeccion] = useState(false);

  const [archivoExcel, setArchivoExcel] = useState(null);

  const [examen, setExamen] = useState({
    nivel_id: "",
    leccion_id: "",
    titulo: "",
    fecha: "",
    preguntas: [{ enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }]
  });

  const [nuevoNivel, setNuevoNivel] = useState("");
  const [nuevaLeccion, setNuevaLeccion] = useState({ titulo: "", contenido: "", nivel_id: "", archivos: [] });

  // ================= CURSO =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCursoNombre(res.data.nombre || "Curso"))
      .catch(() => setCursoNombre("Curso"));
  }, [cursoId]);

  // ================= EXAMENES =================
  const cargarExamenes = () => {
    const token = localStorage.getItem("token");
    axios.get(`http://127.0.0.1:5000/api/examenes/curso/${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setExamenes(res.data || []))
      .catch(() => alert("Error al cargar exámenes"));
  };
  useEffect(() => { if (cursoId) cargarExamenes(); }, [cursoId]);

  // ================= NIVELES =================
  const cargarNiveles = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/niveles/curso/${cursoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setNiveles(res.data || []);
    } catch (err) { console.error(err); }
  };

  // ================= LECCIONES =================
  const cargarLecciones = async (nivel_id = null) => {
    const token = localStorage.getItem("token");
    try {
      let url = `http://127.0.0.1:5000/api/lecciones/curso/${cursoId}`;
      if (nivel_id) url += `?nivel_id=${nivel_id}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setLecciones(res.data || []);
    } catch (err) { console.error(err); }
  };

  // ================= TOGGLE =================
  const toggleNiveles = async () => {
    if (!mostrarNiveles) await cargarNiveles();
    setMostrarNiveles(!mostrarNiveles);
  };

  const toggleLecciones = async () => {
    if (!mostrarLecciones) await cargarLecciones();
    setMostrarLecciones(!mostrarLecciones);
  };

  // ================= HANDLERS EXAMEN =================
  const handleChangeExamen = e => {
    const { name, value } = e.target;
    setExamen(prev => ({ ...prev, [name]: value }));
  };
  const handleNivelChange = e => {
    const nivel_id = e.target.value;
    setExamen(prev => ({ ...prev, nivel_id, leccion_id: "" }));
    cargarLecciones(nivel_id);
  };
  const handlePreguntaChange = (index, field, value, opcionIndex = null) => {
    const preguntas = [...examen.preguntas];
    if (field === "opciones") preguntas[index].opciones[opcionIndex] = value;
    else preguntas[index][field] = value;
    setExamen({ ...examen, preguntas });
  };
  const agregarPregunta = () => setExamen(prev => ({ ...prev, preguntas: [...prev.preguntas, { enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }] }));
  const eliminarPregunta = index => setExamen(prev => ({ ...prev, preguntas: prev.preguntas.filter((_, i) => i !== index) }));

  // ================= CREAR EXAMEN =================
  const crearExamen = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("curso_id", cursoId);
      formData.append("leccion_id", examen.leccion_id);
      formData.append("titulo", examen.titulo);
      formData.append("fecha", examen.fecha);
      if (!archivoExcel) formData.append("preguntas_json", JSON.stringify(examen.preguntas));
      else formData.append("archivo", archivoExcel);

      await axios.post("http://127.0.0.1:5000/api/examenes", formData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Examen creado");
      setMostrarModalExamen(false);
      cargarExamenes();
    } catch (err) {
      console.error(err);
      alert("Error al crear examen");
    }
  };

  // ================= CREAR NIVEL =================
  const crearNivel = async () => {
    if (!nuevoNivel) return alert("Ingresa un título para el nivel");
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://127.0.0.1:5000/api/niveles", { curso_id: cursoId, titulo: nuevoNivel }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Nivel creado");
      setNuevoNivel("");
      await cargarNiveles();
      setMostrarModalNivel(false);
    } catch (err) { console.error(err); }
  };

  // ================= CREAR LECCION =================
  const crearLeccion = async () => {
    if (!nuevaLeccion.titulo || !nuevaLeccion.nivel_id) return alert("Completa todos los campos");
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("curso_id", cursoId);
    formData.append("titulo", nuevaLeccion.titulo);
    formData.append("contenido", nuevaLeccion.contenido);
    formData.append("nivel_id", nuevaLeccion.nivel_id);
    nuevaLeccion.archivos.forEach(f => formData.append("archivos", f));

    try {
      await axios.post("http://127.0.0.1:5000/api/lecciones", formData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Lección creada");
      setNuevaLeccion({ titulo: "", contenido: "", nivel_id: "", archivos: [] });
      await cargarLecciones(nuevaLeccion.nivel_id);
      setMostrarModalLeccion(false);
    } catch (err) { console.error(err); }
  };

  // ================= ELIMINAR =================
  const eliminarExamen = async id => {
    if (!window.confirm("¿Eliminar examen?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://127.0.0.1:5000/api/examenes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setExamenes(prev => prev.filter(ex => ex.id !== id));
  };
  const eliminarNivel = async id => {
    if (!window.confirm("¿Eliminar nivel?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://127.0.0.1:5000/api/niveles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setNiveles(prev => prev.filter(n => n.id !== id));
  };
  const eliminarLeccion = async id => {
    if (!window.confirm("¿Eliminar lección?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://127.0.0.1:5000/api/lecciones/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setLecciones(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="examen-section">
      <div className="header-row">
        <div>
          <h2>Exámenes del curso: {cursoNombre}</h2>
          <div className="top-actions">
            <button className="custom-btn btn-ver" onClick={toggleNiveles}>{mostrarNiveles ? "Ocultar niveles" : "Ver niveles"}</button>
            <button className="custom-btn btn-ver" onClick={toggleLecciones}>{mostrarLecciones ? "Ocultar lecciones" : "Ver lecciones"}</button>
            <button className="custom-btn btn-crear-sec" onClick={() => setMostrarModalNivel(true)}>+ Crear nivel</button>
            <button className="custom-btn btn-crear-sec" onClick={() => setMostrarModalLeccion(true)}>+ Crear lección</button>
          </div>
        </div>
        <button className="custom-btn btn-crear" onClick={() => setMostrarModalExamen(true)}>+ Crear Examen</button>
      </div>

      {/* NIVELES */}
      {mostrarNiveles && niveles.map(n => (
        <div key={n.id} className="card">
          <h4>{n.titulo}</h4>
          <button className="btn btn-danger" onClick={() => eliminarNivel(n.id)}>Eliminar</button>
        </div>
      ))}

      {/* LECCIONES */}
      {mostrarLecciones && lecciones.map(l => (
        <div key={l.id} className="card">
          <h4>{l.titulo}</h4>
          <p>{l.contenido}</p>
          <button className="btn btn-danger" onClick={() => eliminarLeccion(l.id)}>Eliminar</button>
        </div>
      ))}

      {/* EXAMENES */}
      {examenes.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha</th>
              <th># Preguntas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {examenes.map(ex => (
              <tr key={ex.id}>
                <td>{ex.titulo}</td>
                <td>{ex.fecha}</td>
                <td>{ex.preguntas?.length || 0}</td>
                <td>
                  <button className="custom-btn btn-eliminarc" onClick={() => eliminarExamen(ex.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>No hay exámenes</p>}

      {/* MODALES */}
      {mostrarModalExamen && (
        <div className="modal-overlay" onClick={() => setMostrarModalExamen(false)}>
          <div className="modal-form" onClick={e => e.stopPropagation()}>
            <h3>Nuevo Examen</h3>
            <form onSubmit={crearExamen} className="examen-form">
              <select name="nivel_id" value={examen.nivel_id} onChange={handleNivelChange}>
                <option value="">Nivel</option>
                {niveles.map(n => <option key={n.id} value={n.id}>{n.titulo}</option>)}
              </select>
              <select name="leccion_id" value={examen.leccion_id} onChange={handleChangeExamen}>
                <option value="">Lección</option>
                {lecciones.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
              </select>
              <input type="text" name="titulo" placeholder="Título" value={examen.titulo} onChange={handleChangeExamen}/>
              <input type="date" name="fecha" value={examen.fecha} onChange={handleChangeExamen}/>
              
              {examen.preguntas.map((p, idx) => (
                <div key={idx} className="pregunta-card">
                  <input placeholder="Pregunta" value={p.enunciado} onChange={e => handlePreguntaChange(idx,"enunciado",e.target.value)}/>
                  {p.opciones.map((op, i) => (
                    <input key={i} placeholder={`Opción ${i+1}`} value={op} onChange={e => handlePreguntaChange(idx,"opciones",e.target.value,i)}/>
                  ))}
                  <input placeholder="Respuesta correcta" value={p.respuesta_correcta} onChange={e => handlePreguntaChange(idx,"respuesta_correcta",e.target.value)}/>
                  <button type="button" onClick={() => eliminarPregunta(idx)}>Eliminar Pregunta</button>
                </div>
              ))}

              <button type="button" onClick={agregarPregunta}>+ Pregunta</button>
              <input type="file" onChange={e => setArchivoExcel(e.target.files[0])}/>
              <div className="modal-actions">
                <button type="submit" className="btn-save">Guardar</button>
                <button type="button" className="btn-cancel" onClick={() => setMostrarModalExamen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalNivel && (
        <div className="modal-overlay" onClick={() => setMostrarModalNivel(false)}>
          <div className="modal-form" onClick={e => e.stopPropagation()}>
            <h3>Crear Nivel</h3>
            <input placeholder="Título del nivel" value={nuevoNivel} onChange={e => setNuevoNivel(e.target.value)}/>
            <button onClick={crearNivel} className="btn-save">Guardar</button>
          </div>
        </div>
      )}

      {mostrarModalLeccion && (
        <div className="modal-overlay" onClick={() => setMostrarModalLeccion(false)}>
          <div className="modal-form" onClick={e => e.stopPropagation()}>
            <h3>Crear Lección</h3>
            <select value={nuevaLeccion.nivel_id} onChange={e => setNuevaLeccion(prev => ({ ...prev, nivel_id: e.target.value }))}>
              <option value="">Selecciona un nivel</option>
              {niveles.map(n => <option key={n.id} value={n.id}>{n.titulo}</option>)}
            </select>
            <input placeholder="Título" value={nuevaLeccion.titulo} onChange={e => setNuevaLeccion(prev => ({ ...prev, titulo: e.target.value }))}/>
            <textarea placeholder="Contenido" value={nuevaLeccion.contenido} onChange={e => setNuevaLeccion(prev => ({ ...prev, contenido: e.target.value }))}/>
            <input type="file" multiple onChange={e => setNuevaLeccion(prev => ({ ...prev, archivos: Array.from(e.target.files) }))}/>
            <button onClick={crearLeccion} className="btn-save">Guardar</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default VerExamenes;