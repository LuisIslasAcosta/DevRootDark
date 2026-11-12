import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  FaLock,
  FaFlag,
  FaPaperPlane,
  FaPlus,
  FaArrowLeft,
  FaShieldAlt,
  FaComments,
  FaTimes,
  FaSearch
} from "react-icons/fa";
import "../styles/Chat.css";
import { API_URL } from "../../config";

const INTERVALO_MENSAJES = 4000;
const INTERVALO_LISTA = 12000;
const MAX_CARACTERES = 2000;

const MOTIVOS = [
  { valor: "insinuacion", texto: "Insinuación o comentario de tipo sexual" },
  { valor: "acoso", texto: "Acoso, presión o amenazas" },
  { valor: "ofensivo", texto: "Lenguaje ofensivo o discriminatorio" },
  { valor: "datos_personales", texto: "Pide datos personales o contacto fuera de la plataforma" },
  { valor: "otro", texto: "Otro motivo" }
];

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const errorTexto = (err, porDefecto) => err?.response?.data?.mensaje || porDefecto;

const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";

const diaTexto = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

const fechaCorta = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  return fecha.toDateString() === new Date().toDateString()
    ? hora(iso)
    : fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
};

/* ================= AVISO INICIAL ================= */

function AvisoRegistro({ rol, onAceptar }) {
  return (
    <div className="ch-modal-fondo" role="dialog" aria-modal="true" aria-labelledby="ch-aviso-titulo">
      <div className="ch-modal">
        <div className="ch-modal-icono"><FaShieldAlt /></div>
        <h3 id="ch-aviso-titulo">Antes de usar el chat</h3>
        <p>Este chat existe para orientarte académicamente y es seguro para alumnos y profesores:</p>
        <ul>
          <li><FaLock /> <span><strong>Todo queda registrado.</strong> Los mensajes no se pueden editar ni borrar.</span></li>
          <li><FaFlag /> <span>Si recibes un comentario incómodo, una insinuación o presión, usa <strong>Reportar</strong>. El reporte llega directo al administrador y la otra persona no se entera.</span></li>
          <li><FaShieldAlt /> <span>El administrador solo puede leer una conversación cuando alguien la reporta, y su acceso también queda registrado.</span></li>
        </ul>
        <p className="ch-modal-nota">
          {rol === "profesor"
            ? "Mantén un trato profesional y usa el chat solo para temas del curso."
            : "No compartas datos personales como tu dirección, teléfono o redes sociales."}
        </p>
        <button type="button" className="ch-btn" onClick={onAceptar}>Entendido</button>
      </div>
    </div>
  );
}

/* ================= REPORTE ================= */

function ModalReporte({ conversacion, mensajeInicial, mensajes, onCerrar, onEnviado }) {
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensajeId, setMensajeId] = useState(mensajeInicial || "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const delOtro = mensajes.filter((m) => m.tipo === "mensaje" && !m.mio).slice(-15).reverse();

  const enviar = async (e) => {
    e.preventDefault();
    if (!motivo) {
      setError("Elige el motivo del reporte.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversaciones/${conversacion.id}/reportes`,
        { motivo, descripcion, mensaje_id: mensajeId || null },
        { headers: encabezados() }
      );
      onEnviado(res.data?.mensaje || "Reporte enviado al administrador.");
    } catch (err) {
      setError(errorTexto(err, "No se pudo enviar el reporte. Intenta de nuevo."));
      setEnviando(false);
    }
  };

  return (
    <div className="ch-modal-fondo" role="dialog" aria-modal="true" aria-labelledby="ch-reporte-titulo">
      <form className="ch-modal ch-modal-reporte" onSubmit={enviar}>
        <button type="button" className="ch-cerrar" onClick={onCerrar} aria-label="Cerrar"><FaTimes /></button>
        <h3 id="ch-reporte-titulo"><FaFlag /> Reportar conversación</h3>
        <p>
          El administrador revisará tu conversación con <strong>{conversacion.con.nombre}</strong>.{" "}
          {conversacion.con.nombre.split(" ")[0]} <strong>no recibirá ningún aviso</strong> de tu reporte.
        </p>

        <fieldset>
          <legend>¿Qué pasó?</legend>
          {MOTIVOS.map((m) => (
            <label key={m.valor} className={`ch-opcion${motivo === m.valor ? " activa" : ""}`}>
              <input type="radio" name="motivo" value={m.valor} checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} />
              {m.texto}
            </label>
          ))}
        </fieldset>

        {delOtro.length > 0 && (
          <label className="ch-campo">
            <span>Mensaje que quieres señalar (opcional)</span>
            <select value={mensajeId} onChange={(e) => setMensajeId(e.target.value)}>
              <option value="">Toda la conversación</option>
              {delOtro.map((m) => (
                <option key={m.id} value={m.id}>
                  {fechaCorta(m.fecha)} · {m.texto.length > 70 ? `${m.texto.slice(0, 70)}…` : m.texto}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="ch-campo">
          <span>Cuéntanos con tus palabras (opcional)</span>
          <textarea
            rows={3}
            maxLength={MAX_CARACTERES}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe qué te hizo sentir incómodo"
          />
        </label>

        {error && <p className="ch-error">{error}</p>}

        <div className="ch-modal-acciones">
          <button type="button" className="ch-btn ch-btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="ch-btn ch-btn-peligro" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================= COMPONENTE PRINCIPAL ================= */

function Mensajes() {
  const usuario = useMemo(leerUsuario, []);
  const rol = localStorage.getItem("rol") === "profesor" ? "profesor" : "alumno";
  const claveAviso = `chat_aviso_${usuario.id || "anon"}`;
  const [params, setParams] = useSearchParams();

  const [conversaciones, setConversaciones] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [activa, setActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [nueva, setNueva] = useState(false);
  const [reporte, setReporte] = useState(null); // { mensajeId }
  const [avisoAceptado, setAvisoAceptado] = useState(() => {
    try {
      return localStorage.getItem(claveAviso) === "si";
    } catch {
      return false;
    }
  });

  const finRef = useRef(null);
  const activaRef = useRef(null);
  useEffect(() => { activaRef.current = activa; }, [activa]);

  const mostrarAviso = (t) => {
    setAviso(t);
    setTimeout(() => setAviso(""), 4000);
  };

  /* ---------- Cargas ---------- */

  const cargarConversaciones = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversaciones`, { headers: encabezados() });
      setConversaciones(res.data?.conversaciones || []);
    } catch (err) {
      setError(errorTexto(err, "No se pudieron cargar tus conversaciones."));
    }
  }, []);

  const cargarMensajes = useCallback(async (id, silencioso = false) => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversaciones/${id}/mensajes`, { headers: encabezados() });
      if (activaRef.current?.id !== id && silencioso) return;
      setMensajes(res.data?.mensajes || []);
      setActiva(res.data?.conversacion || null);
    } catch (err) {
      if (!silencioso) setError(errorTexto(err, "No se pudo abrir la conversación."));
    }
  }, []);

  const abrirCon = useCallback(
    async (cursoId, usuarioId) => {
      try {
        const res = await axios.post(
          `${API_URL}/chat/conversaciones`,
          { curso_id: cursoId, usuario_id: usuarioId },
          { headers: encabezados() }
        );
        setNueva(false);
        setActiva(res.data);
        await cargarMensajes(res.data.id);
        cargarConversaciones();
      } catch (err) {
        setError(errorTexto(err, "No se pudo iniciar la conversación."));
      }
    },
    [cargarMensajes, cargarConversaciones]
  );

  useEffect(() => {
    let activo = true;
    (async () => {
      await cargarConversaciones();
      try {
        const res = await axios.get(`${API_URL}/chat/contactos`, { headers: encabezados() });
        if (activo) setContactos(res.data?.contactos || []);
      } catch {
        /* sin contactos */
      }
      if (activo) setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [cargarConversaciones]);

  // Abrir directo desde Seguimiento o desde Mi progreso: ?curso=...&usuario=...
  useEffect(() => {
    const curso = params.get("curso");
    if (!curso || cargando) return;
    const otro = params.get("usuario") || undefined;
    setParams({}, { replace: true });
    abrirCon(curso, otro);
  }, [params, cargando, abrirCon, setParams]);

  // Actualización periódica
  useEffect(() => {
    const idMensajes = setInterval(() => {
      if (activaRef.current?.id && !document.hidden) cargarMensajes(activaRef.current.id, true);
    }, INTERVALO_MENSAJES);
    const idLista = setInterval(() => {
      if (!document.hidden) cargarConversaciones();
    }, INTERVALO_LISTA);
    return () => {
      clearInterval(idMensajes);
      clearInterval(idLista);
    };
  }, [cargarMensajes, cargarConversaciones]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length, activa?.id]);

  /* ---------- Acciones ---------- */

  const seleccionar = (conv) => {
    setError("");
    setActiva(conv);
    setMensajes([]);
    cargarMensajes(conv.id);
    setConversaciones((prev) => prev.map((c) => (c.id === conv.id ? { ...c, no_leidos: 0 } : c)));
  };

  const enviar = async (e) => {
    e?.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !activa || enviando) return;
    setEnviando(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversaciones/${activa.id}/mensajes`,
        { texto: limpio },
        { headers: encabezados() }
      );
      setMensajes((prev) => [...prev, res.data]);
      setTexto("");
      cargarConversaciones();
    } catch (err) {
      setError(errorTexto(err, "No se pudo enviar el mensaje."));
    } finally {
      setEnviando(false);
    }
  };

  const alPresionarTecla = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const aceptarAviso = () => {
    try {
      localStorage.setItem(claveAviso, "si");
    } catch {
      /* sin almacenamiento */
    }
    setAvisoAceptado(true);
  };

  /* ---------- Datos derivados ---------- */

  const listaFiltrada = conversaciones.filter((c) =>
    `${c.con.nombre} ${c.curso}`.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const contactosSinChat = contactos.filter(
    (ct) => !conversaciones.some((c) => c.curso_id === ct.curso_id && c.con.id === ct.usuario_id)
  );

  const grupos = [];
  mensajes.forEach((m) => {
    const dia = diaTexto(m.fecha);
    if (!grupos.length || grupos[grupos.length - 1].dia !== dia) grupos.push({ dia, mensajes: [] });
    grupos[grupos.length - 1].mensajes.push(m);
  });

  const cerrada = activa?.estado === "cerrada";

  /* ---------- Render ---------- */

  return (
    <div className="ch">
      {!avisoAceptado && <AvisoRegistro rol={rol} onAceptar={aceptarAviso} />}

      {reporte && activa && (
        <ModalReporte
          conversacion={activa}
          mensajeInicial={reporte.mensajeId}
          mensajes={mensajes}
          onCerrar={() => setReporte(null)}
          onEnviado={(t) => {
            setReporte(null);
            mostrarAviso(t);
            cargarConversaciones();
          }}
        />
      )}

      <div className="ch-encabezado">
        <div>
          <h2><FaComments /> Mensajes</h2>
          <p>
            {rol === "profesor"
              ? "Orienta a tus alumnos de forma segura: cada conversación queda registrada."
              : "Escríbele a tu profesor si tienes dudas del curso. Cada conversación queda registrada."}
          </p>
        </div>
        <span className="ch-sello"><FaLock /> Conversaciones registradas</span>
      </div>

      {error && (
        <p className="ch-error ch-error-global">
          {error} <button type="button" onClick={() => setError("")} aria-label="Cerrar"><FaTimes /></button>
        </p>
      )}
      {aviso && <div className="ch-toast" role="status">{aviso}</div>}

      <div className={`ch-contenedor${activa ? " con-activa" : ""}`}>
        {/* ================= LISTA ================= */}
        <aside className="ch-lista">
          <div className="ch-lista-herramientas">
            <div className="ch-buscar">
              <FaSearch aria-hidden="true" />
              <input type="search" placeholder="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar conversación" />
            </div>
            <button type="button" className="ch-btn ch-btn-icono" onClick={() => setNueva((v) => !v)} aria-label="Nueva conversación" title="Nueva conversación">
              <FaPlus />
            </button>
          </div>

          {nueva && (
            <div className="ch-nueva">
              <span>{rol === "profesor" ? "Escribir a un alumno" : "Escribir a un profesor"}</span>
              {contactosSinChat.length === 0 ? (
                <p className="ch-suave">
                  {contactos.length === 0
                    ? rol === "profesor"
                      ? "Aún no tienes alumnos inscritos."
                      : "Inscríbete a un curso para poder escribir a tu profesor."
                    : "Ya tienes una conversación con todos tus contactos."}
                </p>
              ) : (
                <ul>
                  {contactosSinChat.map((ct) => (
                    <li key={`${ct.curso_id}-${ct.usuario_id}`}>
                      <button type="button" onClick={() => abrirCon(ct.curso_id, rol === "profesor" ? ct.usuario_id : undefined)}>
                        <strong>{ct.nombre}</strong>
                        <span>{ct.curso}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {cargando ? (
            <p className="ch-suave ch-centro">Cargando...</p>
          ) : listaFiltrada.length === 0 ? (
            <div className="ch-lista-vacia">
              <FaComments />
              <p>{conversaciones.length === 0 ? "Aún no tienes conversaciones." : "Sin resultados."}</p>
              {conversaciones.length === 0 && (
                <button type="button" className="ch-btn ch-btn-secundario" onClick={() => setNueva(true)}>
                  <FaPlus /> Nueva conversación
                </button>
              )}
            </div>
          ) : (
            <ul className="ch-conversaciones">
              {listaFiltrada.map((c) => (
                <li key={c.id}>
                  <button type="button" className={`ch-conversacion${activa?.id === c.id ? " activa" : ""}`} onClick={() => seleccionar(c)}>
                    <span className={`ch-avatar ch-avatar-${c.con.rol}`}>{c.con.nombre.charAt(0).toUpperCase()}</span>
                    <span className="ch-conversacion-texto">
                      <span className="ch-conversacion-fila">
                        <strong>{c.con.nombre}</strong>
                        <small>{fechaCorta(c.ultimo_mensaje?.fecha || c.creada)}</small>
                      </span>
                      <span className="ch-conversacion-curso">{c.curso}</span>
                      <span className="ch-conversacion-fila">
                        <span className="ch-conversacion-ultimo">
                          {c.estado === "cerrada"
                            ? "Conversación cerrada"
                            : c.ultimo_mensaje
                              ? `${c.ultimo_mensaje.mio ? "Tú: " : ""}${c.ultimo_mensaje.texto}`
                              : "Sin mensajes"}
                        </span>
                        {c.no_leidos > 0 && <span className="ch-no-leidos">{c.no_leidos}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ================= CONVERSACIÓN ================= */}
        <section className="ch-chat">
          {!activa ? (
            <div className="ch-chat-vacio">
              <FaShieldAlt />
              <h3>Elige una conversación</h3>
              <p>Los mensajes quedan registrados para cuidar a alumnos y profesores.</p>
            </div>
          ) : (
            <>
              <header className="ch-chat-cabecera">
                <button type="button" className="ch-volver" onClick={() => setActiva(null)} aria-label="Volver a la lista"><FaArrowLeft /></button>
                <span className={`ch-avatar ch-avatar-${activa.con.rol}`}>{activa.con.nombre.charAt(0).toUpperCase()}</span>
                <div className="ch-chat-titulo">
                  <strong>{activa.con.nombre}</strong>
                  <span>{activa.con.rol === "profesor" ? "Profesor" : "Alumno"} · {activa.curso}</span>
                </div>
                <button
                  type="button"
                  className="ch-btn ch-btn-reportar"
                  onClick={() => setReporte({ mensajeId: "" })}
                  title="Reportar al administrador"
                >
                  <FaFlag /> Reportar
                </button>
              </header>

              <div className="ch-banda-registro">
                <FaLock /> Esta conversación queda registrada y no se puede borrar.
                {activa.reportada_por_mi && <span> Ya enviaste un reporte; el administrador lo revisará.</span>}
              </div>

              <div className="ch-mensajes" aria-live="polite">
                {grupos.map((g) => (
                  <div key={g.dia}>
                    <div className="ch-dia"><span>{g.dia}</span></div>
                    {g.mensajes.map((m) =>
                      m.tipo === "sistema" ? (
                        <div key={m.id} className="ch-sistema"><FaShieldAlt /> {m.texto}</div>
                      ) : (
                        <div key={m.id} className={`ch-burbuja-fila${m.mio ? " mia" : ""}`}>
                          <div className="ch-burbuja">
                            <p>{m.texto}</p>
                            <span className="ch-hora">{hora(m.fecha)}</span>
                          </div>
                          {!m.mio && !cerrada && (
                            <button
                              type="button"
                              className="ch-marcar"
                              onClick={() => setReporte({ mensajeId: m.id })}
                              title="Reportar este mensaje"
                              aria-label="Reportar este mensaje"
                            >
                              <FaFlag />
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
                <div ref={finRef} />
              </div>

              {cerrada ? (
                <div className="ch-cerrada">El administrador cerró esta conversación. Ya no se pueden enviar mensajes.</div>
              ) : (
                <form className="ch-escribir" onSubmit={enviar}>
                  <textarea
                    rows={1}
                    value={texto}
                    maxLength={MAX_CARACTERES}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={alPresionarTecla}
                    placeholder={`Escribe a ${activa.con.nombre.split(" ")[0]}...`}
                    aria-label="Mensaje"
                  />
                  <button type="submit" className="ch-btn ch-btn-enviar" disabled={!texto.trim() || enviando} aria-label="Enviar">
                    <FaPaperPlane />
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Mensajes;
