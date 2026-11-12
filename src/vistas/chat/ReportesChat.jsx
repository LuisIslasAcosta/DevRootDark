import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  FaFlag,
  FaShieldAlt,
  FaLock,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaUser
} from "react-icons/fa";
import "../styles/Chat.css";
import { API_URL } from "../../config";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

const DESCRIPCION_DECISION = {
  sin_falta: "La conversación sigue abierta. No se avisa a nadie.",
  advertencia: "La conversación sigue abierta y aparece un aviso del administrador recordando mantener un trato respetuoso.",
  conducta_grave: "Se cierra la conversación: ya nadie podrá enviar mensajes. Considera también revisar la cuenta del usuario en Usuarios."
};

function ReportesChat() {
  const [estado, setEstado] = useState("pendiente");
  const [datos, setDatos] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL}/chat/admin/reportes`, {
        headers: encabezados(),
        params: estado === "todos" ? {} : { estado }
      });
      setDatos(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudieron cargar los reportes.");
    } finally {
      setCargando(false);
    }
  }, [estado]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const abrir = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/chat/admin/reportes/${id}`, { headers: encabezados() });
      setDetalle(res.data);
      setDecision(res.data.reporte.decision || "");
      setNota(res.data.reporte.nota_admin || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo abrir el reporte.");
    }
  };

  const resolver = async (e) => {
    e.preventDefault();
    if (!decision) return;
    setGuardando(true);
    try {
      await axios.put(
        `${API_URL}/chat/admin/reportes/${detalle.reporte.id}`,
        { decision, nota },
        { headers: encabezados() }
      );
      await abrir(detalle.reporte.id);
      cargarLista();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo guardar la decisión.");
    } finally {
      setGuardando(false);
    }
  };

  /* ================= DETALLE ================= */

  if (detalle) {
    const r = detalle.reporte;
    const c = detalle.conversacion;
    return (
      <div className="ch ch-admin">
        <button type="button" className="ch-btn ch-btn-secundario ch-regresar" onClick={() => setDetalle(null)}>
          <FaArrowLeft /> Volver a los reportes
        </button>

        <div className="ch-admin-aviso">
          <FaEye /> Estás viendo una conversación privada por un reporte. Tu acceso queda registrado
          ({r.accesos_admin.length} {r.accesos_admin.length === 1 ? "acceso" : "accesos"}).
        </div>

        <div className="ch-admin-detalle">
          <section className="ch-tarjeta">
            <div className="ch-tarjeta-cabecera">
              <h3><FaFlag /> {r.motivo_texto}</h3>
              <span className={`ch-estado ch-estado-${r.estado}`}>{r.estado === "pendiente" ? "Pendiente" : "Resuelto"}</span>
            </div>
            <dl className="ch-datos">
              <div><dt>Reporta</dt><dd>{r.reporta.nombre} <small>({r.reporta.rol}) {r.reporta.email}</small></dd></div>
              <div><dt>Reportado</dt><dd>{r.reportado.nombre} <small>({r.reportado.rol}) {r.reportado.email}</small></dd></div>
              <div><dt>Curso</dt><dd>{r.curso}</dd></div>
              <div><dt>Fecha</dt><dd>{fechaHora(r.fecha)}</dd></div>
              <div><dt>Conversación</dt><dd>{c.estado === "cerrada" ? "Cerrada" : "Abierta"}</dd></div>
            </dl>
            {r.descripcion && (
              <blockquote className="ch-cita">
                <FaUser /> “{r.descripcion}”
              </blockquote>
            )}

            {detalle.otros_reportes.length > 0 && (
              <p className="ch-alerta-otros">
                <FaExclamationTriangle /> Esta conversación tiene {detalle.otros_reportes.length} reporte(s) más.
              </p>
            )}

            {r.estado === "resuelto" ? (
              <div className="ch-resuelto">
                <FaCheckCircle />
                <div>
                  <strong>{r.decision_texto}</strong>
                  {r.nota_admin && <p>{r.nota_admin}</p>}
                  <small>Por {r.resuelto_por} · {fechaHora(r.fecha_resolucion)}</small>
                </div>
              </div>
            ) : (
              <form className="ch-decision" onSubmit={resolver}>
                <h4>Tu decisión</h4>
                {Object.entries(datos?.decisiones || {}).map(([valor, texto]) => (
                  <label key={valor} className={`ch-opcion${decision === valor ? " activa" : ""}${valor === "conducta_grave" ? " grave" : ""}`}>
                    <input type="radio" name="decision" value={valor} checked={decision === valor} onChange={() => setDecision(valor)} />
                    <span>
                      <strong>{texto}</strong>
                      <small>{DESCRIPCION_DECISION[valor]}</small>
                    </span>
                  </label>
                ))}
                <label className="ch-campo">
                  <span>Nota interna (solo la ven los administradores)</span>
                  <textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="¿Qué encontraste y por qué decidiste esto?" />
                </label>
                <button type="submit" className="ch-btn" disabled={!decision || guardando}>
                  {guardando ? "Guardando..." : "Guardar decisión"}
                </button>
              </form>
            )}
          </section>

          <section className="ch-tarjeta ch-transcripcion">
            <div className="ch-tarjeta-cabecera">
              <h3><FaLock /> Conversación completa</h3>
              <small>{c.profesor} (profesor) · {c.alumno} (alumno)</small>
            </div>
            <div className="ch-mensajes ch-mensajes-admin">
              {detalle.mensajes.map((m) =>
                m.tipo === "sistema" ? (
                  <div key={m.id} className="ch-sistema"><FaShieldAlt /> {m.texto}</div>
                ) : (
                  <div
                    key={m.id}
                    className={`ch-burbuja-fila${m.autor_rol === "profesor" ? " mia" : ""}${m.id === r.mensaje_id ? " senalado" : ""}`}
                  >
                    <div className="ch-burbuja">
                      <span className="ch-autor">{m.autor_nombre} · {m.autor_rol}</span>
                      <p>{m.texto}</p>
                      <span className="ch-hora">{fechaHora(m.fecha)}</span>
                      {m.id === r.mensaje_id && <span className="ch-senal"><FaFlag /> Mensaje señalado</span>}
                    </div>
                  </div>
                )
              )}
            </div>
            <details className="ch-accesos">
              <summary>Registro de accesos de administradores</summary>
              <ul>
                {r.accesos_admin.map((a, i) => <li key={i}>{a.admin} · {fechaHora(a.fecha)}</li>)}
              </ul>
            </details>
          </section>
        </div>
      </div>
    );
  }

  /* ================= LISTA ================= */

  return (
    <div className="ch ch-admin">
      <div className="ch-encabezado">
        <div>
          <h2><FaShieldAlt /> Reportes de chat</h2>
          <p>
            Conversaciones entre profesores y alumnos que alguno de ellos reportó. Solo puedes leer las conversaciones
            reportadas, y cada vez que abres una queda registrado.
          </p>
        </div>
        {datos && <span className="ch-sello ch-sello-alerta"><FaFlag /> {datos.pendientes} pendientes</span>}
      </div>

      <div className="ch-pestanas">
        {[["pendiente", "Pendientes"], ["resuelto", "Resueltos"], ["todos", "Todos"]].map(([valor, texto]) => (
          <button key={valor} type="button" className={estado === valor ? "activa" : ""} onClick={() => setEstado(valor)}>
            {texto}
          </button>
        ))}
      </div>

      {error && <p className="ch-error">{error}</p>}

      {cargando ? (
        <p className="ch-suave">Cargando reportes...</p>
      ) : !datos?.reportes?.length ? (
        <div className="ch-chat-vacio">
          <FaCheckCircle />
          <h3>{estado === "pendiente" ? "No hay reportes pendientes" : "No hay reportes"}</h3>
        </div>
      ) : (
        <div className="ch-reportes">
          {datos.reportes.map((r) => (
            <button key={r.id} type="button" className={`ch-reporte ch-reporte-${r.estado}`} onClick={() => abrir(r.id)}>
              <span className="ch-reporte-fila">
                <strong><FaFlag /> {r.motivo_texto}</strong>
                <span className={`ch-estado ch-estado-${r.estado}`}>{r.estado === "pendiente" ? "Pendiente" : "Resuelto"}</span>
              </span>
              <span>
                <b>{r.reporta.nombre}</b> ({r.reporta.rol}) reportó a <b>{r.reportado.nombre}</b> ({r.reportado.rol})
              </span>
              <span className="ch-suave">{r.curso} · {fechaHora(r.fecha)}</span>
              {r.descripcion && <span className="ch-reporte-desc">“{r.descripcion}”</span>}
              {r.estado === "resuelto" && <span className="ch-suave">Decisión: {r.decision_texto}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportesChat;
