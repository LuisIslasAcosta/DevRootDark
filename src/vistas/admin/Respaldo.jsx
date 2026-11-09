import React, { useState, useEffect } from "react";
import {
  FaClock,
  FaDatabase,
  FaUpload,
  FaDownload,
  FaTrashAlt,
  FaExclamationTriangle
} from "react-icons/fa";
import "../styles/Respaldo.css";
import { API_URL } from "../../config";

const API = API_URL;

const TIPOS = [
  { value: "completo", label: "Completo", ayuda: "Copia de todos los datos de la base." },
  { value: "incremental", label: "Incremental", ayuda: "Solo los cambios desde el último respaldo." },
  { value: "diferencial", label: "Diferencial", ayuda: "Los cambios desde el último respaldo completo." }
];

const FRECUENCIAS = [
  { value: "horas", label: "Por horas" },
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" }
];

const ayudaTipo = (tipo) => TIPOS.find((t) => t.value === tipo)?.ayuda || "";
const etiquetaTipo = (tipo) => TIPOS.find((t) => t.value === tipo)?.label || tipo;

const formatearFecha = (nombreArchivo) => {
  const m = nombreArchivo.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
  if (!m) return "-";
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, s).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const descargarBlob = (blob, nombre) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
};

function Respaldo() {
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(""); // "config" | "generar" | "restaurar" | "eliminar"

  // Respaldo automático
  const [tipoRespaldo, setTipoRespaldo] = useState("completo");
  const [intervalo, setIntervalo] = useState("horas");
  const [valorIntervalo, setValorIntervalo] = useState(24);

  // Respaldo manual
  const [tipoManual, setTipoManual] = useState("completo");

  // Restauración
  const [archivoRespaldo, setArchivoRespaldo] = useState(null);
  const [claveArchivo, setClaveArchivo] = useState(0);

  // Diálogo de confirmación: { accion: "restaurar" } | { accion: "eliminar", respaldo }
  const [confirmacion, setConfirmacion] = useState(null);

  const cargarRespaldos = () => {
    fetch(`${API}/respaldos`)
      .then((res) => {
        if (!res.ok) throw new Error("Error de servidor");
        return res.json();
      })
      .then(setLista)
      .catch((err) => {
        console.error("Error al cargar respaldos:", err);
        setAviso({ tipo: "error", texto: "No se pudo cargar la lista de respaldos." });
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarRespaldos();
  }, []);

  // El aviso desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  // Cerrar el diálogo con Escape
  useEffect(() => {
    if (!confirmacion) return;
    const onKey = (e) => e.key === "Escape" && !ocupado && setConfirmacion(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmacion, ocupado]);

  const resumenAutomatico = () => {
    const tipo = etiquetaTipo(tipoRespaldo).toLowerCase();
    if (intervalo === "horas") {
      const n = Number(valorIntervalo);
      return n > 0
        ? `Se hará un respaldo ${tipo} cada ${n} ${n === 1 ? "hora" : "horas"}.`
        : "Escribe cada cuántas horas se hará el respaldo.";
    }
    const frecuencia = { diario: "todos los días", semanal: "cada semana", mensual: "cada mes" }[intervalo];
    return `Se hará un respaldo ${tipo} ${frecuencia}.`;
  };

  /* ---------- Acciones ---------- */
  const guardarConfig = () => {
    if (intervalo === "horas" && !(Number(valorIntervalo) > 0)) {
      setAviso({ tipo: "error", texto: "Indica un número de horas mayor a 0." });
      return;
    }
    setOcupado("config");
    fetch(`${API}/config-respaldo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo_respaldo: tipoRespaldo, intervalo, valor: valorIntervalo })
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) =>
        setAviso({ tipo: ok ? "ok" : "error", texto: data.message || (ok ? "Configuración guardada." : "No se pudo guardar la configuración.") })
      )
      .catch(() => setAviso({ tipo: "error", texto: "No se pudo guardar la configuración." }))
      .finally(() => setOcupado(""));
  };

  const generarRespaldoManual = () => {
    setOcupado("generar");
    fetch(`${API}/respaldo/${tipoManual}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al generar");
        return res.blob();
      })
      .then((blob) => {
        descargarBlob(blob, `respaldo-${tipoManual}.json`);
        setAviso({ tipo: "ok", texto: "Respaldo generado correctamente." });
        cargarRespaldos();
      })
      .catch(() => setAviso({ tipo: "error", texto: "No se pudo generar el respaldo." }))
      .finally(() => setOcupado(""));
  };

  const descargarRespaldo = (respaldo) => {
    fetch(`${API}/respaldo/${respaldo.tipo}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al descargar");
        return res.blob();
      })
      .then((blob) => descargarBlob(blob, respaldo.nombre))
      .catch(() => setAviso({ tipo: "error", texto: "No se pudo descargar el respaldo." }));
  };

  const eliminarRespaldo = () => {
    const { respaldo } = confirmacion;
    setOcupado("eliminar");
    fetch(`${API}/respaldo/${respaldo.tipo}/${respaldo.nombre}`, { method: "DELETE" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        setAviso({ tipo: ok ? "ok" : "error", texto: data.message || (ok ? "Respaldo eliminado." : "No se pudo eliminar el respaldo.") });
        cargarRespaldos();
      })
      .catch(() => setAviso({ tipo: "error", texto: "No se pudo eliminar el respaldo." }))
      .finally(() => {
        setOcupado("");
        setConfirmacion(null);
      });
  };

  const restaurarRespaldo = () => {
    if (!archivoRespaldo) return;
    const formData = new FormData();
    formData.append("file", archivoRespaldo);
    setOcupado("restaurar");
    fetch(`${API}/respaldo`, { method: "POST", body: formData })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        setAviso({ tipo: ok ? "ok" : "error", texto: data.message || (ok ? "Base de datos restaurada." : "No se pudo restaurar el respaldo.") });
        if (ok) {
          setArchivoRespaldo(null);
          setClaveArchivo((k) => k + 1);
          cargarRespaldos();
        }
      })
      .catch(() => setAviso({ tipo: "error", texto: "No se pudo restaurar el respaldo." }))
      .finally(() => {
        setOcupado("");
        setConfirmacion(null);
      });
  };

  return (
    <div className="respaldo-section">
      <header className="rs-header">
        <h2>Respaldo de base de datos</h2>
        <p className="rs-sub">Programa copias automáticas, genera una al momento o restaura la base desde un archivo.</p>
      </header>

      {aviso && (
        <div className={`rs-aviso ${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}

      <div className="rs-grid">
        {/* Automático */}
        <section className="rs-panel">
          <h3>
            <FaClock /> Respaldo automático
          </h3>
          <label className="rs-campo">
            <span>Tipo de respaldo</span>
            <select value={tipoRespaldo} onChange={(e) => setTipoRespaldo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <small>{ayudaTipo(tipoRespaldo)}</small>
          </label>

          <label className="rs-campo">
            <span>Frecuencia</span>
            <select value={intervalo} onChange={(e) => setIntervalo(e.target.value)}>
              {FRECUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          {intervalo === "horas" && (
            <label className="rs-campo">
              <span>Cada cuántas horas</span>
              <input
                type="number"
                min="1"
                value={valorIntervalo}
                onChange={(e) => setValorIntervalo(e.target.value)}
              />
            </label>
          )}

          <p className="rs-resumen">{resumenAutomatico()}</p>

          <button type="button" className="rs-btn rs-btn--primario" onClick={guardarConfig} disabled={ocupado === "config"}>
            {ocupado === "config" ? "Guardando..." : "Guardar configuración"}
          </button>
        </section>

        {/* Manual */}
        <section className="rs-panel">
          <h3>
            <FaDatabase /> Respaldo manual
          </h3>
          <label className="rs-campo">
            <span>Tipo de respaldo</span>
            <select value={tipoManual} onChange={(e) => setTipoManual(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <small>{ayudaTipo(tipoManual)}</small>
          </label>
          <p className="rs-resumen">El archivo se descargará en tu equipo y quedará en la lista de respaldos guardados.</p>
          <button type="button" className="rs-btn rs-btn--primario" onClick={generarRespaldoManual} disabled={ocupado === "generar"}>
            {ocupado === "generar" ? "Generando..." : "Generar ahora"}
          </button>
        </section>

        {/* Restaurar */}
        <section className="rs-panel">
          <h3>
            <FaUpload /> Restaurar desde archivo
          </h3>
          <label className="rs-campo">
            <span>Archivo de respaldo (.json)</span>
            <input
              key={claveArchivo}
              type="file"
              accept=".json"
              onChange={(e) => setArchivoRespaldo(e.target.files[0] || null)}
            />
            <small>{archivoRespaldo ? archivoRespaldo.name : "Ningún archivo seleccionado"}</small>
          </label>
          <p className="rs-advertencia">
            <FaExclamationTriangle aria-hidden="true" />
            <span>Restaurar reemplaza los datos actuales de la base. Genera un respaldo antes si no quieres perderlos.</span>
          </p>
          <button
            type="button"
            className="rs-btn rs-btn--peligro"
            onClick={() => setConfirmacion({ accion: "restaurar" })}
            disabled={!archivoRespaldo || ocupado === "restaurar"}
          >
            Restaurar respaldo
          </button>
        </section>
      </div>

      {/* Lista */}
      <section className="rs-panel rs-panel--tabla">
        <h3>
          Respaldos guardados <span className="rs-conteo">{lista.length}</span>
        </h3>

        {!cargando && lista.length === 0 ? (
          <div className="rs-vacio">
            <FaDatabase aria-hidden="true" />
            <p>Aún no hay respaldos guardados. Genera el primero con el botón Generar ahora.</p>
          </div>
        ) : (
          <div className="rs-tabla-wrap">
            <table className="tabla-respaldos">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r, i) => (
                  <tr key={`${r.tipo}-${r.nombre}-${i}`}>
                    <td data-label="Nombre" className="rs-nombre">
                      {r.nombre}
                    </td>
                    <td data-label="Tipo">
                      <span className={`rs-tipo ${r.tipo}`}>{etiquetaTipo(r.tipo)}</span>
                    </td>
                    <td data-label="Fecha">{formatearFecha(r.nombre)}</td>
                    <td data-label="Acciones" className="col-acciones">
                      <div className="rs-acciones">
                        <button type="button" className="rs-btn rs-btn--suave" onClick={() => descargarRespaldo(r)}>
                          <FaDownload /> Descargar
                        </button>
                        <button
                          type="button"
                          className="rs-btn rs-btn--eliminar"
                          onClick={() => setConfirmacion({ accion: "eliminar", respaldo: r })}
                        >
                          <FaTrashAlt /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Diálogo de confirmación */}
      {confirmacion && (
        <div
          className="rs-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => !ocupado && setConfirmacion(null)}
        >
          <div className="rs-dialogo" onClick={(e) => e.stopPropagation()}>
            {confirmacion.accion === "eliminar" ? (
              <>
                <h4>Eliminar respaldo</h4>
                <p>
                  ¿Seguro que quieres eliminar <strong>{confirmacion.respaldo.nombre}</strong>? Esta acción no se puede
                  deshacer.
                </p>
              </>
            ) : (
              <>
                <h4>Restaurar base de datos</h4>
                <p>
                  Se reemplazarán los datos actuales con los de <strong>{archivoRespaldo?.name}</strong>. Esta acción no
                  se puede deshacer.
                </p>
              </>
            )}
            <div className="rs-dialogo-acciones">
              <button type="button" className="rs-btn rs-btn--ghost" onClick={() => setConfirmacion(null)} disabled={!!ocupado}>
                Cancelar
              </button>
              <button
                type="button"
                className="rs-btn rs-btn--peligro"
                onClick={confirmacion.accion === "eliminar" ? eliminarRespaldo : restaurarRespaldo}
                disabled={!!ocupado}
              >
                {ocupado
                  ? confirmacion.accion === "eliminar"
                    ? "Eliminando..."
                    : "Restaurando..."
                  : confirmacion.accion === "eliminar"
                  ? "Eliminar"
                  : "Restaurar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Respaldo;