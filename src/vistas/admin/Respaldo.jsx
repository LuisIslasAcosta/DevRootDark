import React, { useState, useEffect } from "react";
import "../styles/Respaldo.css";

function Respaldo() {
  const [mensaje, setMensaje] = useState("");
  const [intervalo, setIntervalo] = useState("horas");
  const [valorIntervalo, setValorIntervalo] = useState(24);
  const [tipoRespaldo, setTipoRespaldo] = useState("completo");
  const [archivoRespaldo, setArchivoRespaldo] = useState(null);
  const [confirmarRestauracion, setConfirmarRestauracion] = useState(false);
  const [lista, setLista] = useState([]);

  useEffect(() => { cargarRespaldos(); }, []);

  const cargarRespaldos = () => {
    fetch("http://127.0.0.1:5000/api/respaldos")
      .then(res => res.json())
      .then(data => setLista(data));
  };

  const guardarConfig = () => {
    fetch("http://127.0.0.1:5000/api/config-respaldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo_respaldo: tipoRespaldo, intervalo, valor: valorIntervalo })
    }).then(res => res.json()).then(data => setMensaje(data.message));
  };

  const generarRespaldoManual = () => {
    fetch(`http://127.0.0.1:5000/api/respaldo/${tipoRespaldo}`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `respaldo-${tipoRespaldo}.json`;
        a.click();
        setMensaje("Respaldo generado correctamente.");
        cargarRespaldos();
      });
  };

  const seleccionarArchivo = (e) => {
    setArchivoRespaldo(e.target.files[0]);
    setConfirmarRestauracion(true);
  };

  const restaurarRespaldo = () => {
    if (!archivoRespaldo) return;
    const formData = new FormData();
    formData.append("file", archivoRespaldo);
    fetch("http://127.0.0.1:5000/api/respaldo", { method: "POST", body: formData })
      .then(res => res.json())
      .then(data => {
        setMensaje(data.message);
        setConfirmarRestauracion(false);
        setArchivoRespaldo(null);
        cargarRespaldos();
      });
  };

  const descargarRespaldo = (respaldo) => {
    fetch(`http://127.0.0.1:5000/api/respaldo/${respaldo.tipo}`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = respaldo.nombre;
        a.click();
      });
  };

  const eliminarRespaldo = (respaldo) => {
    if (!window.confirm(`¿Eliminar respaldo '${respaldo.nombre}'?`)) return;
    fetch(`http://127.0.0.1:5000/api/respaldo/${respaldo.tipo}/${respaldo.nombre}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        setMensaje(data.message);
        cargarRespaldos();
      });
  };

  const formatearFecha = (nombreArchivo) => {
    const match = nombreArchivo.match(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
    return match ? match[0].replace("_", " ") : "-";
  };

  return (
    <div className="respaldo-section">
      <h2>Respaldo de Base de Datos</h2>

      <h3>Configuración automática</h3>
      <select value={tipoRespaldo} onChange={e => setTipoRespaldo(e.target.value)}>
        <option value="completo">Completo</option>
        <option value="incremental">Incremental</option>
        <option value="diferencial">Diferencial</option>
      </select>
      <select value={intervalo} onChange={e => setIntervalo(e.target.value)}>
        <option value="horas">Por horas</option>
        <option value="diario">Diario</option>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
      </select>
      {intervalo === "horas" && <input type="number" value={valorIntervalo} onChange={e => setValorIntervalo(e.target.value)} />}
      <button onClick={guardarConfig}>Guardar configuración</button>

      <h3>Manual</h3>
      <button onClick={generarRespaldoManual}>Generar ahora</button>

      <h3>Respaldos guardados</h3>
      <table className="tabla-respaldos">
        <thead>
          <tr>
            <th>Nombre</th><th>Tipo</th><th>Fecha</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((r, i) => (
            <tr key={i}>
              <td>{r.nombre}</td>
              <td>{r.tipo}</td>
              <td>{formatearFecha(r.nombre)}</td>
              <td>
                <button onClick={() => descargarRespaldo(r)} style={{ background: "green", color: "white", marginRight: "5px" }}>Descargar</button>
                <button onClick={() => eliminarRespaldo(r)} style={{ background: "darkred", color: "white" }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Restaurar manual</h3>
      <input type="file" accept=".json" onChange={seleccionarArchivo} />
      {confirmarRestauracion && (
        <button onClick={restaurarRespaldo} style={{ background: "red", color: "white", marginTop: "5px" }}>Confirmar restauración</button>
      )}

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