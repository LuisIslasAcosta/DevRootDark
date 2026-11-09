import React, { useState } from "react";
import axios from "axios";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import { API_URL } from "../../config";

// Agrega preguntas desde un Excel a un examen que ya existe
function ImportarExcelPreguntas({ examenId, examenTitulo, onImportado, onCerrar }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: "ok" | "error", texto }
  const [inputKey, setInputKey] = useState(0);

  const subir = async () => {
    if (!archivo) {
      setMensaje({ tipo: "error", texto: "Selecciona un archivo Excel (.xlsx) primero." });
      return;
    }
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("examen_id", examenId);

    try {
      setSubiendo(true);
      setMensaje(null);
      const res = await axios.post(`${API_URL}/preguntas/importar_excel`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMensaje({ tipo: "ok", texto: res.data?.mensaje || "Preguntas importadas." });
      setArchivo(null);
      setInputKey(k => k + 1);
      onImportado?.(res.data?.importadas || 0);
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.mensaje || "No se pudo importar el Excel. Revisa tu conexión.",
      });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="importar-excel">
      <div className="importar-excel__encabezado">
        <h4>Importar preguntas desde Excel{examenTitulo ? ` · ${examenTitulo}` : ""}</h4>
        {onCerrar && (
          <button type="button" className="custom-btn" onClick={onCerrar} aria-label="Cerrar">✕</button>
        )}
      </div>

      <p className="excel-ayuda">
        Columnas: <code>pregunta</code>, <code>opcion1</code> a <code>opcion4</code> y{" "}
        <code>respuesta_correcta</code> (texto de la opción, letra A–D o número 1–4).{" "}
        <a href="/plantillas/plantilla_preguntas.xlsx" download>Descargar plantilla</a>
      </p>

      <div className="importar-excel__acciones">
        <input
          key={inputKey}
          type="file"
          accept=".xlsx,.csv"
          onChange={e => { setArchivo(e.target.files[0] || null); setMensaje(null); }}
        />
        <button type="button" className="custom-btn btn-crear" onClick={subir} disabled={subiendo}>
          {subiendo ? "Importando..." : "Subir Excel"}
        </button>
      </div>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "excel-ok" : "excel-error"} style={{ whiteSpace: "pre-line" }}>
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}

export default ImportarExcelPreguntas;
