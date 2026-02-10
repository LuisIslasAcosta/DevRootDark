import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Examenes.css";

function CrearExamen() {
  const [cursos, setCursos] = useState([]);
  const [examen, setExamen] = useState({
    curso_id: "",
    titulo: "",
    fecha: "",
    preguntas: [""]
  });

  // 🔹 Cargar cursos del profesor
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/mis_cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setCursos(res.data))
    .catch(err => console.error("Error al cargar cursos:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamen({ ...examen, [name]: value });
  };

  const handlePreguntaChange = (index, value) => {
    const nuevasPreguntas = [...examen.preguntas];
    nuevasPreguntas[index] = value;
    setExamen({ ...examen, preguntas: nuevasPreguntas });
  };

  const agregarPregunta = () => {
    setExamen({ ...examen, preguntas: [...examen.preguntas, ""] });
  };

  const eliminarPregunta = (index) => {
    const nuevasPreguntas = examen.preguntas.filter((_, i) => i !== index);
    setExamen({ ...examen, preguntas: nuevasPreguntas });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examen.curso_id || !examen.titulo || !examen.fecha) {
      alert("Curso, título y fecha son obligatorios");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/api/examenes", examen, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Examen creado correctamente ✅");
      setExamen({ curso_id: "", titulo: "", fecha: "", preguntas: [""] });
    } catch (err) {
      console.error(err);
      alert("Error al crear examen ❌");
    }
  };

  return (
    <div className="examen-section">
      <h2>Crear Examen</h2>
      <form className="examen-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Curso</label>
          <select
            name="curso_id"
            value={examen.curso_id}
            onChange={handleChange}
          >
            <option value="">Selecciona un curso</option>
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>{curso.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Título</label>
          <input
            type="text"
            name="titulo"
            value={examen.titulo}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Fecha</label>
          <input
            type="date"
            name="fecha"
            value={examen.fecha}
            onChange={handleChange}
          />
        </div>

        <div className="preguntas-section">
          <label>Preguntas</label>
          {examen.preguntas.map((pregunta, index) => (
            <div key={index} className="pregunta-item">
              <input
                type="text"
                value={pregunta}
                onChange={e => handlePreguntaChange(index, e.target.value)}
                placeholder={`Pregunta ${index + 1}`}
              />
              {examen.preguntas.length > 1 && (
                <button type="button" className="custom-btn btn-eliminar" onClick={() => eliminarPregunta(index)}>Eliminar</button>
              )}
            </div>
          ))}
          <button type="button" className="custom-btn btn-agregar" onClick={agregarPregunta}>
            Agregar Pregunta
          </button>
        </div>

        <button type="submit" className="custom-btn btn-crear">
          Crear Examen
        </button>
      </form>
    </div>
  );
}

export default CrearExamen;
