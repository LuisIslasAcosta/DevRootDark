import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaWifi } from "react-icons/fa";
import { iniciarSincronizacion, sincronizar, useEstadoConexion } from "../offline/sincronizar";
import "./EstadoConexion.css";

// Aviso fijo: "Sin conexión", "Sincronizando..." o "Sincronizado"
function EstadoConexion() {
  const { fase, pendientes, mensaje } = useEstadoConexion();

  useEffect(() => {
    iniciarSincronizacion();
  }, []);

  if (fase === "en_linea") return null;

  const textoPendientes = pendientes
    ? ` · ${pendientes} ${pendientes === 1 ? "envío pendiente" : "envíos pendientes"}`
    : "";

  return (
    <div className={`conexion-aviso conexion-${fase}`} role="status" aria-live="polite">
      {fase === "sin_conexion" && (
        <>
          <FaWifi className="conexion-icono-tachado" />
          <span><strong>Offline</strong> · Sin conexión. Puedes seguir con tus cursos descargados{textoPendientes}.</span>
        </>
      )}
      {fase === "sincronizando" && (
        <>
          <FaSyncAlt className="conexion-girando" />
          <span><strong>Sincronizando...</strong> enviando lo que hiciste sin conexión{textoPendientes}.</span>
        </>
      )}
      {fase === "sincronizado" && (
        <>
          <FaCheckCircle />
          <span><strong>Sincronizado</strong>{mensaje ? ` · ${mensaje}` : ""}</span>
        </>
      )}
      {fase === "error" && (
        <>
          <FaExclamationTriangle />
          <span>{mensaje || "No se pudo sincronizar."}{textoPendientes}</span>
          <button type="button" onClick={() => sincronizar()}>Reintentar</button>
        </>
      )}
    </div>
  );
}

export default EstadoConexion;
