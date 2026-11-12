import React from "react";
import { ESTADOS_INSCRIPCION } from "./pagos";
import "./pagos.css";

// Etiqueta de color con el estado de la inscripción
function EstadoInscripcion({ estado }) {
  const info = ESTADOS_INSCRIPCION[estado] || ESTADOS_INSCRIPCION.aceptada;
  return <span className={`estado-insc estado-insc--${info.clase}`}>{info.texto}</span>;
}

export default EstadoInscripcion;
