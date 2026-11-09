import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";

function EditarExamen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examen, setExamen] = useState({ titulo: "", fecha: "", preguntas: [] });

  useEffect(() => {
    axios.get(`https://defense-situation-bouquet-aqua.trycloudflare.com//api/examenes`)
      .then(res => {
        const encontrado = res.data.find(e => e.id === id);
        if (encontrado) setExamen(encontrado);
      });
  }, [id]);

  const actualizarPregunta = (index, valor) => {
    const nuevas = [...examen.preguntas];
    nuevas[index] = valor;
    setExamen({ ...examen, preguntas: nuevas });
  };

  const guardar = async () => {
    await axios.put(`https://defense-situation-bouquet-aqua.trycloudflare.com//api/examenes/${id}`, examen);
    alert("Examen actualizado");
    navigate("/profesor/examenes");
  };

  return (
    <div>
      <h2>Editar Examen</h2>

      <input value={examen.titulo} onChange={e => setExamen({ ...examen, titulo: e.target.value })} />
      <input type="date" value={examen.fecha} onChange={e => setExamen({ ...examen, fecha: e.target.value })} />

      {examen.preguntas.map((p, i) => (
        <input key={i} value={p} onChange={e => actualizarPregunta(i, e.target.value)} />
      ))}

      <button onClick={guardar}>Guardar</button>
    </div>
  );
}

export default EditarExamen;
