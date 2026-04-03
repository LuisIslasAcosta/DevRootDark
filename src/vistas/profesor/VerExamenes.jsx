import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Examenes.css";

function VerExamenes() {

  const { cursoId } = useParams();

  const [examenes, setExamenes] = useState([]);
  const [cursoNombre, setCursoNombre] = useState("");

  const [niveles, setNiveles] = useState([]);
  const [lecciones, setLecciones] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState(null);

  const [examen, setExamen] = useState({
    nivel_id: "",
    leccion_id: "",
    titulo: "",
    fecha: "",
    preguntas: [
      { enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }
    ]
  });

  // ================= CURSO =================
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get(`http://127.0.0.1:5000/api/cursos/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setCursoNombre(res.data.nombre || "Curso"))
    .catch(() => setCursoNombre("Curso"));
  }, [cursoId]);

  // ================= EXAMENES =================
  const cargarExamenes = () => {
    const token = localStorage.getItem("token");

    axios.get(`http://127.0.0.1:5000/api/examenes/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setExamenes(res.data || []))
    .catch(() => alert("Error al cargar exámenes"));
  };

  useEffect(() => {
    if (cursoId) cargarExamenes();
  }, [cursoId]);

  // ================= NIVELES =================
  useEffect(() => {
    if (!cursoId) return;

    const token = localStorage.getItem("token");

    axios.get(`http://127.0.0.1:5000/api/niveles/curso/${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setNiveles(res.data || []))
    .catch(console.error);
  }, [cursoId]);

  // ================= LECCIONES =================
  useEffect(() => {
    if (!examen.nivel_id) return;

    const token = localStorage.getItem("token");

    axios.get(`http://127.0.0.1:5000/api/lecciones/nivel/${examen.nivel_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setLecciones(res.data || []))
    .catch(console.error);
  }, [examen.nivel_id]);

  // ================= HANDLERS =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamen(prev => ({ ...prev, [name]: value }));
  };

  const handleNivelChange = (e) => {
    setExamen(prev => ({
      ...prev,
      nivel_id: e.target.value,
      leccion_id: ""
    }));
    setLecciones([]);
  };

  const handlePreguntaChange = (index, field, value, opcionIndex = null) => {
    const preguntas = [...examen.preguntas];

    if (field === "opciones") {
      preguntas[index].opciones[opcionIndex] = value;
    } else {
      preguntas[index][field] = value;
    }

    setExamen({ ...examen, preguntas });
  };

  const agregarPregunta = () => {
    setExamen(prev => ({
      ...prev,
      preguntas: [...prev.preguntas, { enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }]
    }));
  };

  const eliminarPregunta = (index) => {
    setExamen(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter((_, i) => i !== index)
    }));
  };

  // ================= CREAR =================
  const crearExamen = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("curso_id", cursoId);
      formData.append("leccion_id", examen.leccion_id);
      formData.append("titulo", examen.titulo);
      formData.append("fecha", examen.fecha);

      if (!archivoExcel) {
        formData.append("preguntas_json", JSON.stringify(examen.preguntas));
      } else {
        formData.append("archivo", archivoExcel);
      }

      await axios.post("http://127.0.0.1:5000/api/examenes", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Examen creado");

      setMostrarModal(false);
      cargarExamenes();

    } catch (err) {
      console.error(err);
      alert("Error al crear examen");
    }
  };

  // ================= ELIMINAR =================
  const eliminarExamen = async (id) => {
    if (!window.confirm("¿Eliminar examen?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://127.0.0.1:5000/api/examenes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExamenes(prev => prev.filter(ex => ex.id !== id));

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="examen-section">

      <h2>Exámenes del curso: {cursoNombre}</h2>

      {/* BOTON */}
      <button className="fab-btn" onClick={() => setMostrarModal(true)}>
        + Crear Examen
      </button>

      {/* TABLA */}
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
                  <button className="custom-btn btn-eliminarc" onClick={() => eliminarExamen(ex.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay exámenes en este curso.</p>
      )}

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>

          <div className="modal-form" onClick={e => e.stopPropagation()}>

            <h3>Nuevo Examen</h3>

            <form onSubmit={crearExamen} className="examen-form">

              <select name="nivel_id" value={examen.nivel_id} onChange={handleNivelChange}>
                <option value="">Nivel</option>
                {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>

              <select name="leccion_id" value={examen.leccion_id} onChange={handleChange}>
                <option value="">Lección</option>
                {lecciones.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
              </select>

              <input type="text" name="titulo" placeholder="Título" value={examen.titulo} onChange={handleChange}/>
              <input type="date" name="fecha" value={examen.fecha} onChange={handleChange}/>

              {examen.preguntas.map((p, idx) => (
                <div key={idx} className="pregunta-card">
                  <input placeholder="Pregunta" value={p.enunciado} onChange={e => handlePreguntaChange(idx,"enunciado",e.target.value)}/>
                  {p.opciones.map((op, i) => (
                    <input key={i} placeholder={`Opción ${i+1}`} value={op} onChange={e => handlePreguntaChange(idx,"opciones",e.target.value,i)}/>
                  ))}
                  <input placeholder="Respuesta correcta" value={p.respuesta_correcta} onChange={e => handlePreguntaChange(idx,"respuesta_correcta",e.target.value)}/>
                </div>
              ))}

              <button type="button" onClick={agregarPregunta}>+ Pregunta</button>

              <input type="file" onChange={e => setArchivoExcel(e.target.files[0])}/>

              <div className="modal-actions">
                <button type="submit" className="btn-save">Guardar</button>
                <button type="button" className="btn-cancel" onClick={()=>setMostrarModal(false)}>Cancelar</button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default VerExamenes;