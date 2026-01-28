import React, { useState } from "react";
import '../styles/Respaldo.css'

function Respaldo() {
  const [mensaje, setMensaje] = useState("");
  const [carpeta, setCarpeta] = useState("C:/RespaldosDB"); // carpeta por defecto
  const [intervalo, setIntervalo] = useState("horas"); // tipo de intervalo
  const [valorIntervalo, setValorIntervalo] = useState(24); // valor en horas

  // Guardar configuración en backend
  const guardarConfig = () => {
    fetch("http://127.0.0.1:5000/api/config-respaldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carpeta, intervalo, valor: valorIntervalo })
    })
      .then(res => res.json())
      .then(data => setMensaje(data.message))
      .catch(err => {
        console.error("Error al guardar configuración:", err);
        setMensaje("Error al guardar configuración.");
      });
  };

  // Generar respaldo manual
  const generarRespaldoManual = () => {
    fetch("http://127.0.0.1:5000/api/respaldo")
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `respaldo-manual-${new Date().toISOString()}.json`;
        a.click();
        setMensaje("Respaldo manual generado y descargado.");
      })
      .catch(err => console.error("Error al generar respaldo manual:", err));
  };

  // Restaurar respaldo subido
  const restaurarRespaldo = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:5000/api/respaldo", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setMensaje(data.message || "Respaldo restaurado correctamente.");
      })
      .catch(err => {
        console.error("Error al restaurar respaldo:", err);
        setMensaje("Error al restaurar respaldo.");
      });
  };

  return (
    <div className="respaldo-section">
      <h2>Respaldo de Base de Datos</h2>

      <h3>Configuración automática</h3>
      <label>
        Carpeta destino:
        <input
          type="text"
          value={carpeta}
          onChange={(e) => setCarpeta(e.target.value)}
          placeholder="Ejemplo: C:/RespaldosDB"
        />
      </label>

      <label>
        Tipo de intervalo:
        <select value={intervalo} onChange={(e) => setIntervalo(e.target.value)}>
          <option value="horas">Pos horas</option>
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </select>
      </label>

      {intervalo === "horas" && (
        <label>
          Valor (horas):
          <input
            type="number"
            value={valorIntervalo}
            onChange={(e) => setValorIntervalo(e.target.value)}
            min="1"
          />
        </label>
      )}

      <button onClick={guardarConfig}>Guardar configuración</button>

      <h3>Acciones manuales</h3>
      <button onClick={generarRespaldoManual}>Generar respaldo ahora</button>

      <div style={{ marginTop: "20px" }}>
        <label>
          Restaurar respaldo:
          <input type="file" accept=".json" onChange={restaurarRespaldo} />
        </label>
      </div>

      {mensaje && (
                    <div className="mensaje-overlay">
                        <div className="mensaje-contenido">
                        <h2>{mensaje}</h2>
                        <button onClick={() => setMensaje("")}>Cerrar</button>
                        </div>
                    </div>
                    )}
    </div>
  );
}

export default Respaldo;