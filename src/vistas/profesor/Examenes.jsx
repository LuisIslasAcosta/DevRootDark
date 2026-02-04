import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import axios from "axios";

function Examenes() {
  const [examenes, setExamenes] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/examenes")
      .then(res => setExamenes(res.data))
      .catch(err => console.error("Error al cargar examenes:", err));
  }, []);

  const eliminarExamen = (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este examen?")) return;
    axios.delete(`http://127.0.0.1:5000/api/examenes/${id}`)
      .then(() => setExamenes(examenes.filter(e => e.id !== id)))
      .catch(err => console.error("Error al eliminar examen:", err));
  };

  return (
    <div>
      <h2>Gestión de Exámenes</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Curso</th>
            <th>Título</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map(ex => (
            <tr key={ex.id}>
              <td>{ex.curso_nombre}</td>
              <td>{ex.titulo}</td>
              <td>{ex.fecha}</td>
              <td>
                <Button variant="danger" onClick={() => eliminarExamen(ex.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Examenes;