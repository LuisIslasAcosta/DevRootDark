import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import axios from "axios";

function Inscripciones() {
  const [inscripciones, setInscripciones] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/inscripciones")
      .then(res => setInscripciones(res.data))
      .catch(err => console.error("Error al cargar inscripciones:", err));
  }, []);

  const eliminarInscripcion = (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta inscripción?")) return;
    axios.delete(`http://127.0.0.1:5000/api/inscripciones/${id}`)
      .then(() => setInscripciones(inscripciones.filter(i => i.id !== id)))
      .catch(err => console.error("Error al eliminar inscripción:", err));
  };

  return (
    <div>
      <h2>Gestión de Inscripciones</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Curso</th>
            <th>Alumno</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inscripciones.map(ins => (
            <tr key={ins.id}>
              <td>{ins.curso_nombre}</td>
              <td>{ins.alumno_nombre}</td>
              <td>
                <Button variant="danger" onClick={() => eliminarInscripcion(ins.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Inscripciones;