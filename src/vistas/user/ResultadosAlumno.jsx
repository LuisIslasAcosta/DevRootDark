import React, { useEffect, useState } from "react";
import axios from "axios";

function ResultadosAlumno() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/respuestas/alumno/${usuario.id}`)
      .then(res => setResultados(res.data));
  }, []);

  return (
    <div>
      <h2>Mis Resultados</h2>

      {resultados.map(r => (
        <div key={r.id} className="resultado-card">
          <p>Examen: {r.examen_id}</p>
          <p>Calificación: {r.calificacion}%</p>
          <p>{r.correctas} / {r.total}</p>
        </div>
      ))}
    </div>
  );
}

export default ResultadosAlumno;
