import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Examenes.css";

function CrearExamen() {
  const [cursos, setCursos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [lecciones, setLecciones] = useState([]);

  const [archivoExcel, setArchivoExcel] = useState(null);

  const [examen, setExamen] = useState({
    curso_id: "",
    nivel_id: "",
    leccion_id: "",
    titulo: "",
    fecha: "",
    preguntas: [
      { enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }
    ]
  });

  // ================= CARGAR CURSOS =================
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setCursos(res.data || []))
    .catch(err => console.error("Error al cargar cursos:", err));
  }, []);

  // ================= CARGAR NIVELES =================
  useEffect(() => {
    if (!examen.curso_id) return;

    axios.get(`http://127.0.0.1:5000/api/niveles/curso/${examen.curso_id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setNiveles(res.data || []))
    .catch(err => console.error("Error al cargar niveles:", err));
  }, [examen.curso_id]);

  // ================= CARGAR LECCIONES =================
  useEffect(() => {
    if (!examen.nivel_id) return;

    axios.get(`http://127.0.0.1:5000/api/lecciones/nivel/${examen.nivel_id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setLecciones(res.data || []))
    .catch(err => console.error("Error al cargar lecciones:", err));
  }, [examen.nivel_id]);

  // ================= RESET CAMPOS =================
  const handleCursoChange = (e) => {
    const cursoId = e.target.value;
    setExamen(prev => ({
      ...prev,
      curso_id: cursoId,
      nivel_id: "",
      leccion_id: ""
    }));
    setNiveles([]);
    setLecciones([]);
  };

  const handleNivelChange = (e) => {
    const nivelId = e.target.value;
    setExamen(prev => ({
      ...prev,
      nivel_id: nivelId,
      leccion_id: ""
    }));
    setLecciones([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamen(prev => ({ ...prev, [name]: value }));
  };

  // ================= PREGUNTAS MANUALES =================
  const handlePreguntaChange = (index, field, value, opcionIndex = null) => {
    setExamen(prev => {
      const preguntas = [...prev.preguntas];
      if (field === "opciones") {
        preguntas[index].opciones[opcionIndex] = value;
      } else {
        preguntas[index][field] = value;
      }
      return { ...prev, preguntas };
    });
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

  // ================= SUBIR EXCEL =================
  const handleArchivoChange = (e) => {
    setArchivoExcel(e.target.files[0]);
  };

  // ================= CREAR EXAMEN =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!examen.curso_id || !examen.nivel_id || !examen.leccion_id || !examen.titulo || !examen.fecha) {
      alert("Curso, nivel, lección, título y fecha son obligatorios ");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("curso_id", examen.curso_id);
      formData.append("leccion_id", examen.leccion_id);
      formData.append("titulo", examen.titulo);
      formData.append("fecha", examen.fecha);

      // Solo enviar preguntas manuales si no hay archivo Excel
      if (!archivoExcel) {
        formData.append("preguntas_json", JSON.stringify(examen.preguntas));
      }

      if (archivoExcel) {
        formData.append("archivo", archivoExcel);
      }

      await axios.post("http://127.0.0.1:5000/api/examenes", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      alert("Examen creado correctamente ");

      setExamen({
        curso_id: "",
        nivel_id: "",
        leccion_id: "",
        titulo: "",
        fecha: "",
        preguntas: [{ enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: "" }]
      });
      setArchivoExcel(null);
      setNiveles([]);
      setLecciones([]);
    } catch (err) {
      console.error(err);
      alert("Error al crear examen ");
    }
  };

  return (
    <div className="examen-section">
      <h2>Crear Examen</h2>

      <form className="examen-form" onSubmit={handleSubmit}>
        {/* CURSO */}
        <div className="form-group">
          <label>Curso</label>
          <select name="curso_id" value={examen.curso_id} onChange={handleCursoChange}>
            <option value="">Selecciona un curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {/* NIVEL */}
        <div className="form-group">
          <label>Nivel</label>
          <select name="nivel_id" value={examen.nivel_id} onChange={handleNivelChange} disabled={!examen.curso_id}>
            <option value="">{examen.curso_id ? "Selecciona un nivel" : "Selecciona un curso primero"}</option>
            {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre || n.titulo}</option>)}
          </select>
        </div>

        {/* LECCIÓN */}
        <div className="form-group">
          <label>Lección</label>
          <select name="leccion_id" value={examen.leccion_id} onChange={handleChange} disabled={!examen.nivel_id}>
            <option value="">{examen.nivel_id ? "Selecciona una lección" : "Selecciona un nivel primero"}</option>
            {lecciones.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
          </select>
        </div>

        {/* TITULO */}
        <div className="form-group">
          <label>Título</label>
          <input type="text" name="titulo" value={examen.titulo} onChange={handleChange} />
        </div>

        {/* FECHA */}
        <div className="form-group">
          <label>Fecha</label>
          <input type="date" name="fecha" value={examen.fecha} onChange={handleChange} />
        </div>

        {/* PREGUNTAS MANUALES */}
        <div className="preguntas-section">
          <label>Preguntas (Manual)</label>
          {examen.preguntas.map((p, idx) => (
            <div key={idx} className="pregunta-item">
              <input
                type="text"
                placeholder={`Pregunta ${idx + 1}`}
                value={p.enunciado}
                onChange={e => handlePreguntaChange(idx, "enunciado", e.target.value)}
              />
              {p.opciones.map((op, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Opción ${i + 1}`}
                  value={op}
                  onChange={e => handlePreguntaChange(idx, "opciones", e.target.value, i)}
                />
              ))}
              <input
                type="text"
                placeholder="Respuesta correcta"
                value={p.respuesta_correcta}
                onChange={e => handlePreguntaChange(idx, "respuesta_correcta", e.target.value)}
              />
              {examen.preguntas.length > 1 && (
                <button type="button" onClick={() => eliminarPregunta(idx)}>Eliminar</button>
              )}
            </div>
          ))}
          <button type="button" onClick={agregarPregunta}>Agregar Pregunta</button>
        </div>

        {/* SUBIR EXCEL */}
        <div className="form-group">
          <label>O subir archivo Excel</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleArchivoChange} />
        </div>

        <button type="submit">Crear Examen</button>
      </form>
    </div>
  );
}

export default CrearExamen;
