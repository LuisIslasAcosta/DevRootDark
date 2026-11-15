import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "../styles/EstilosAlumno.css";
import "../styles/ExamenOffline.css";
import { API_URL } from "../../config";
import {
  borrarPaquete,
  borrarProgreso,
  descargarPaquete,
  guardarProgreso,
  leerPaquete,
  leerProgreso,
  pendienteDeExamen,
  resultadoGuardado,
  usuarioActual,
} from "../../offline/examenOffline";
import { agregarPendiente, alSincronizar, sincronizar, useEstadoConexion } from "../../offline/sincronizar";

// Segundos que el alumno puede estar fuera de la ventana antes de que el examen se envíe solo
const SEGUNDOS_FUERA_PERMITIDOS = 3;

const soportaPantallaCompleta = () =>
  typeof document !== "undefined" && document.fullscreenEnabled && !!document.documentElement.requestFullscreen;

const estaEnPantallaCompleta = () => !!document.fullscreenElement;

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
};

const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

const formatoReloj = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// Atajos de teclado bloqueados durante el examen
const esAtajoBloqueado = (e) => {
  const tecla = (e.key || "").toLowerCase();
  const ctrl = e.ctrlKey || e.metaKey;

  if (tecla === "printscreen" || tecla === "f12") return "Esa tecla está bloqueada durante el examen.";
  if (ctrl && e.shiftKey && ["i", "j", "c", "k", "s"].includes(tecla)) return "Las herramientas del navegador están bloqueadas.";
  if (ctrl && ["c", "x", "v", "a", "p", "s", "u", "f"].includes(tecla)) return "Copiar, pegar, imprimir y buscar están bloqueados.";
  if (e.metaKey && e.shiftKey && ["3", "4", "5", "s"].includes(tecla)) return "Las capturas de pantalla están bloqueadas.";
  return null;
};

function ResponderExamen() {
  const { id: examenId } = useParams();
  const { fase: faseConexion } = useEstadoConexion();

  // fase: cargando | sin_paquete | bloqueado | pendiente | instrucciones | en_curso | enviado
  const [fase, setFase] = useState("cargando");
  const [paquete, setPaquete] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [restanteMs, setRestanteMs] = useState(null);
  const [resultado, setResultado] = useState(null); // { calificacion, pendiente, requiere_revision, rechazado }
  const [motivoAuto, setMotivoAuto] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Protección del examen
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [fueraDeFoco, setFueraDeFoco] = useState(false);
  const [aviso, setAviso] = useState("");

  // Refs para leer siempre el valor más reciente dentro de los listeners
  const paqueteRef = useRef(null);
  const progresoRef = useRef(null); // { respuestas, iniciado_cliente, duracion_ms, eventos, sin_conexion }
  const enviadoRef = useRef(false);
  const enCursoRef = useRef(false);
  const ultimoTickRef = useRef(0);
  const temporizadorFueraRef = useRef(null);
  const temporizadorAvisoRef = useRef(null);
  const enviarRef = useRef(null);

  const usuario = leerUsuario();
  const marcaDeAgua = [usuario.nombre, usuario.email].filter(Boolean).join(" · ") || "DevRootDark";
  const enCurso = fase === "en_curso";

  const persistir = useCallback(() => {
    const p = paqueteRef.current;
    if (p && progresoRef.current) guardarProgreso(p.intento_id, progresoRef.current).catch(() => {});
  }, []);

  const registrarEvento = useCallback((tipo, detalle = "") => {
    const prog = progresoRef.current;
    if (!prog) return;
    prog.eventos = [...(prog.eventos || []), { tipo, detalle, en: Date.now() }].slice(-200);
    persistir();
  }, [persistir]);

  const mostrarAviso = useCallback((texto) => {
    setAviso(texto);
    clearTimeout(temporizadorAvisoRef.current);
    temporizadorAvisoRef.current = setTimeout(() => setAviso(""), 2500);
  }, []);

  // ================= RESULTADO DEL SERVIDOR =================
  const mostrarResultadoDe = useCallback(async (intentoId) => {
    const pendiente = await pendienteDeExamen(examenId);
    if (pendiente && pendiente.intento_id === intentoId) {
      setResultado({ pendiente: !pendiente.rechazado, rechazado: pendiente.rechazado || "" });
      return;
    }
    const r = await resultadoGuardado(examenId);
    if (r && r.intento_id === intentoId) {
      setResultado({ calificacion: r.calificacion, requiere_revision: r.requiere_revision, correctas: r.correctas, total: r.total });
    } else {
      setResultado({ pendiente: true });
    }
  }, [examenId]);

  // ================= ENVIAR (manual, automático o por tiempo) =================
  const enviar = useCallback(async (motivo = "") => {
    const p = paqueteRef.current;
    const prog = progresoRef.current;
    if (enviadoRef.current || !p || !prog) return;

    const automatico = Boolean(motivo);
    if (!automatico && Object.keys(prog.respuestas || {}).length !== p.preguntas.length) {
      alert("Debes responder todas las preguntas");
      return;
    }

    enviadoRef.current = true;
    enCursoRef.current = false;
    clearTimeout(temporizadorFueraRef.current);
    setMotivoAuto(motivo);
    setFase("enviado");
    setResultado({ pendiente: true });
    if (estaEnPantallaCompleta()) document.exitFullscreen?.().catch(() => {});

    // Se guarda primero en el dispositivo: si no hay señal, se manda al reconectar
    const cuerpo = {
      clave_envio: p.clave_envio,
      respuestas: prog.respuestas || {},
      iniciado_cliente: prog.iniciado_cliente,
      finalizado_cliente: Date.now(),
      duracion_ms: Math.round(prog.duracion_ms || 0),
      eventos: prog.eventos || [],
      motivo,
      sin_conexion: Boolean(prog.sin_conexion || !navigator.onLine),
    };
    try {
      await agregarPendiente(`examen-${p.intento_id}`, {
        tipo: "examen",
        intento_id: p.intento_id,
        examen_id: examenId,
        alumno_id: usuarioActual(),
        titulo: p.titulo,
        cuerpo,
      });
      await borrarProgreso(p.intento_id);
      await borrarPaquete(examenId);
    } catch (err) {
      console.error("No se pudo guardar el examen en el dispositivo:", err);
    }

    if (navigator.onLine) await sincronizar();
    await mostrarResultadoDe(p.intento_id);
  }, [examenId, mostrarResultadoDe]);

  useEffect(() => { enviarRef.current = enviar; }, [enviar]);

  // ================= CARGAR EXAMEN (del dispositivo o del servidor) =================
  useEffect(() => {
    if (!examenId) return;
    let cancelado = false;

    const cargar = async () => {
      // ¿Ya lo terminó y está esperando a sincronizarse?
      const pendiente = await pendienteDeExamen(examenId).catch(() => null);
      if (pendiente) {
        if (cancelado) return;
        paqueteRef.current = { titulo: pendiente.titulo, intento_id: pendiente.intento_id };
        setPaquete(paqueteRef.current);
        setFase("pendiente");
        setResultado({ pendiente: !pendiente.rechazado, rechazado: pendiente.rechazado || "" });
        return;
      }

      let p = await leerPaquete(examenId).catch(() => null);
      if ((!p || p.vencido) && navigator.onLine) {
        try {
          p = await descargarPaquete(examenId);
        } catch (err) {
          if (cancelado) return;
          const codigo = err.response?.status;
          if (!err.response || codigo === 503) {
            setFase("sin_paquete");
          } else {
            setMensaje(err.response?.data?.mensaje || "No se pudo cargar el examen");
            setFase(codigo === 409 || codigo === 403 ? "bloqueado" : "sin_paquete");
          }
          return;
        }
      }
      if (cancelado) return;
      if (!p || p.vencido) {
        setMensaje(p?.vencido ? "El examen descargado ya venció. Conéctate para descargarlo de nuevo." : "");
        setFase("sin_paquete");
        return;
      }

      paqueteRef.current = p;
      setPaquete(p);

      const prog = await leerProgreso(p.intento_id).catch(() => null);
      if (prog?.iniciado_cliente) {
        // Lo empezó y cerró o recargó la página: se envía con lo que llevaba (misma regla que salir del examen)
        progresoRef.current = prog;
        setRespuestas(prog.respuestas || {});
        registrarEvento("salio_de_ventana", "Cerró o recargó la página durante el examen");
        enviarRef.current?.("Cerraste o recargaste la página mientras respondías.");
        return;
      }
      progresoRef.current = { respuestas: {}, eventos: [], duracion_ms: 0, sin_conexion: !navigator.onLine };
      setFase("instrucciones");
    };

    cargar();
    return () => { cancelado = true; };
  }, [examenId, registrarEvento]);

  // Cuando se sincroniza en segundo plano, se actualiza la calificación en pantalla
  useEffect(() => alSincronizar(() => {
    const id = paqueteRef.current?.intento_id;
    if (id && (fase === "enviado" || fase === "pendiente")) mostrarResultadoDe(id);
  }), [fase, mostrarResultadoDe]);

  // ================= RESPONDER =================
  const handleChange = (preguntaId, opcion) => {
    if (enviadoRef.current || !progresoRef.current) return;
    const nuevas = { ...progresoRef.current.respuestas, [preguntaId]: opcion };
    progresoRef.current.respuestas = nuevas;
    setRespuestas(nuevas);
    persistir();
  };

  // ================= INICIAR EN PANTALLA COMPLETA =================
  const entrarPantallaCompleta = async () => {
    if (!soportaPantallaCompleta()) return;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (err) {
      console.error("No se pudo activar pantalla completa:", err);
    }
  };

  const comenzar = async () => {
    const p = paqueteRef.current;
    if (!p) return;
    await entrarPantallaCompleta();
    setPantallaCompleta(estaEnPantallaCompleta());
    const prog = progresoRef.current;
    prog.iniciado_cliente = Date.now();
    prog.sin_conexion = prog.sin_conexion || !navigator.onLine;
    await guardarProgreso(p.intento_id, prog).catch(() => {});

    // Con señal, el servidor anota la hora real de inicio
    if (navigator.onLine) {
      axios.post(`${API_URL}/intentos/${p.intento_id}/iniciar`,
        { clave_envio: p.clave_envio },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, timeout: 10000 })
        .catch(() => {});
    }
    ultimoTickRef.current = performance.now();
    enCursoRef.current = true;
    setFase("en_curso");
  };

  // ================= CRONÓMETRO =================
  useEffect(() => {
    if (!enCurso) return;
    const p = paqueteRef.current;
    const limiteMs = (p?.duracion_minutos || 60) * 60000;

    const tick = () => {
      const prog = progresoRef.current;
      if (!prog || enviadoRef.current) return;
      const ahora = performance.now();
      prog.duracion_ms = (prog.duracion_ms || 0) + (ahora - ultimoTickRef.current);
      ultimoTickRef.current = ahora;

      // Se toma el mayor entre el cronómetro interno y el reloj, por si el reloj se mueve hacia atrás
      const transcurrido = Math.max(prog.duracion_ms, Date.now() - prog.iniciado_cliente);
      let restante = limiteMs - transcurrido;
      if (p.iniciado_en) {
        const finServidor = new Date(p.iniciado_en).getTime() + limiteMs;
        restante = Math.min(restante, finServidor - (Date.now() + (p.desfase_ms || 0)));
      }
      setRestanteMs(restante);
      if (restante <= 0) enviarRef.current?.("Se terminó el tiempo del examen.");
    };

    tick();
    const intervalo = setInterval(tick, 1000);
    const guardadoPeriodico = setInterval(persistir, 5000);
    return () => {
      clearInterval(intervalo);
      clearInterval(guardadoPeriodico);
    };
  }, [enCurso, persistir]);

  // Si se pierde la señal durante el examen se anota (el examen sigue sin problema)
  useEffect(() => {
    if (!enCurso || faseConexion !== "sin_conexion") return;
    if (progresoRef.current) progresoRef.current.sin_conexion = true;
    registrarEvento("se_perdio_la_conexion");
  }, [faseConexion, enCurso, registrarEvento]);

  // ================= PROTECCIONES MIENTRAS EL EXAMEN ESTÁ EN CURSO =================
  useEffect(() => {
    if (!enCurso) return;

    // 1. Cambiar de pestaña o minimizar: se envía de inmediato
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        registrarEvento("cambio_de_pestana");
        enviar("Cambiaste de pestaña o minimizaste la ventana.");
      }
    };

    // 2. Salir de la ventana (Alt+Tab, otra app, herramienta de recortes): se ocultan las
    //    preguntas y, si no regresa en unos segundos, se envía
    const alPerderFoco = () => {
      setFueraDeFoco(true);
      registrarEvento("salio_de_ventana");
      clearTimeout(temporizadorFueraRef.current);
      temporizadorFueraRef.current = setTimeout(
        () => enviar("Saliste de la ventana del examen por más de " + SEGUNDOS_FUERA_PERMITIDOS + " segundos."),
        SEGUNDOS_FUERA_PERMITIDOS * 1000
      );
    };

    const alRecuperarFoco = () => {
      clearTimeout(temporizadorFueraRef.current);
      setFueraDeFoco(false);
    };

    // 3. Pantalla completa: si la quita, se ocultan las preguntas hasta que vuelva
    const alCambiarPantallaCompleta = () => {
      const activa = estaEnPantallaCompleta();
      if (!activa && soportaPantallaCompleta()) registrarEvento("salio_de_pantalla_completa");
      setPantallaCompleta(activa);
    };

    // 4. Copiar, cortar, pegar, click derecho, arrastrar y seleccionar
    const bloquear = (texto) => (e) => {
      e.preventDefault();
      mostrarAviso(texto);
    };
    const alCopiar = bloquear("Copiar está bloqueado durante el examen.");
    const alCortar = bloquear("Cortar está bloqueado durante el examen.");
    const alPegar = bloquear("Pegar está bloqueado durante el examen.");
    const alClickDerecho = bloquear("El click derecho está bloqueado durante el examen.");
    const alArrastrar = (e) => e.preventDefault();
    const alSeleccionar = (e) => e.preventDefault();

    // 5. Atajos de teclado (copiar, imprimir, captura, herramientas de desarrollador)
    const alPresionarTecla = (e) => {
      const motivo = esAtajoBloqueado(e);
      if (!motivo) return;
      e.preventDefault();
      e.stopPropagation();
      registrarEvento("atajo_bloqueado", e.key);
      mostrarAviso(motivo);
    };

    // La tecla Impr Pant no se puede cancelar: borramos lo que haya quedado en el portapapeles
    const alSoltarTecla = (e) => {
      if ((e.key || "").toLowerCase() === "printscreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        registrarEvento("captura_de_pantalla");
        mostrarAviso("Las capturas de pantalla están bloqueadas.");
      }
    };

    // 6. Imprimir desde el menú del navegador
    const alImprimir = () => mostrarAviso("Imprimir está bloqueado durante el examen.");

    // 7. Cerrar o recargar la página (si lo hace, al volver se envía lo que llevaba)
    const antesDeSalir = (e) => {
      persistir();
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("blur", alPerderFoco);
    window.addEventListener("focus", alRecuperarFoco);
    document.addEventListener("fullscreenchange", alCambiarPantallaCompleta);
    document.addEventListener("copy", alCopiar);
    document.addEventListener("cut", alCortar);
    document.addEventListener("paste", alPegar);
    document.addEventListener("contextmenu", alClickDerecho);
    document.addEventListener("dragstart", alArrastrar);
    document.addEventListener("selectstart", alSeleccionar);
    document.addEventListener("keydown", alPresionarTecla, true);
    document.addEventListener("keyup", alSoltarTecla, true);
    window.addEventListener("beforeprint", alImprimir);
    window.addEventListener("beforeunload", antesDeSalir);
    document.body.classList.add("examen-protegido");

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("blur", alPerderFoco);
      window.removeEventListener("focus", alRecuperarFoco);
      document.removeEventListener("fullscreenchange", alCambiarPantallaCompleta);
      document.removeEventListener("copy", alCopiar);
      document.removeEventListener("cut", alCortar);
      document.removeEventListener("paste", alPegar);
      document.removeEventListener("contextmenu", alClickDerecho);
      document.removeEventListener("dragstart", alArrastrar);
      document.removeEventListener("selectstart", alSeleccionar);
      document.removeEventListener("keydown", alPresionarTecla, true);
      document.removeEventListener("keyup", alSoltarTecla, true);
      window.removeEventListener("beforeprint", alImprimir);
      window.removeEventListener("beforeunload", antesDeSalir);
      document.body.classList.remove("examen-protegido");
      clearTimeout(temporizadorFueraRef.current);
    };
  }, [enCurso, enviar, mostrarAviso, persistir, registrarEvento]);

  // Si sale de la página del examen (por ejemplo, con el menú lateral), se envía y se quita pantalla completa
  useEffect(() => () => {
    clearTimeout(temporizadorAvisoRef.current);
    if (enCursoRef.current && !enviadoRef.current) {
      enviarRef.current?.("Saliste de la página del examen.");
    }
    if (estaEnPantallaCompleta()) document.exitFullscreen?.().catch(() => {});
  }, []);

  // ================= PANTALLAS =================
  if (fase === "cargando") return <p>Cargando examen...</p>;

  if (fase === "sin_paquete") {
    return (
      <div className="responder-examen">
        <h2>Examen no disponible sin conexión</h2>
        <p className="eo-nota">
          {mensaje || "Este examen no está descargado en este dispositivo."} Conéctate a internet para
          presentarlo, o entra al curso con señal y usa <strong>Descargar para ver sin conexión</strong>.
        </p>
        <Link to="/principal/mis-cursos" className="custom-btn btn-enviar">Ir a Mis cursos</Link>
      </div>
    );
  }

  if (fase === "bloqueado") {
    return (
      <div className="responder-examen">
        <h2>No puedes presentar este examen</h2>
        <p className="eo-nota">{mensaje}</p>
        <Link to="/principal/resultados" className="custom-btn btn-enviar">Ver mis resultados</Link>
      </div>
    );
  }

  if (fase === "enviado" || fase === "pendiente") {
    return (
      <div className="responder-examen">
        <h2>{paquete?.titulo || "Examen"} {resultado?.pendiente ? "guardado" : "enviado"}</h2>

        {motivoAuto && (
          <p className="pf-error" style={{ marginBottom: "1rem" }}>
            {motivoAuto} Por eso el examen se envió automáticamente con las respuestas que tenías.
          </p>
        )}

        {resultado?.rechazado ? (
          <p className="eo-nota eo-nota-error">El servidor no aceptó este examen: {resultado.rechazado}</p>
        ) : resultado?.pendiente ? (
          <div className="resultado-card eo-pendiente">
            <p>{faseConexion === "sincronizando" ? "Sincronizando..." : "Pendiente de enviar"}</p>
            <p className="eo-pendiente-texto">
              Tus respuestas quedaron guardadas en este dispositivo. Se enviarán y calificarán solas en cuanto
              haya internet. No cierres sesión ni borres los datos del navegador hasta que diga <strong>Sincronizado</strong>.
            </p>
          </div>
        ) : (
          <div className="resultado-card">
            <p>Calificación</p>
            <p>{resultado?.calificacion ?? "Calculando..."}</p>
            {resultado?.requiere_revision && (
              <small className="eo-revision">Tu profesor revisará este intento antes de confirmarlo.</small>
            )}
          </div>
        )}
      </div>
    );
  }

  if (fase === "instrucciones") {
    const preguntas = paquete.preguntas || [];
    return (
      <div className="responder-examen">
        <h2>Antes de comenzar</h2>

        {preguntas.length === 0 ? (
          <p>No hay preguntas disponibles.</p>
        ) : (
          <div className="examen-reglas">
            <div className="eo-datos">
              <span>Intento <strong>{paquete.intento_numero} de {paquete.intentos_max}</strong></span>
              <span>Tiempo: <strong>{paquete.duracion_minutos} min</strong></span>
              <span className={faseConexion === "sin_conexion" ? "eo-chip eo-chip-offline" : "eo-chip"}>
                {faseConexion === "sin_conexion" ? "Offline: se enviará al reconectar" : "Con conexión"}
              </span>
            </div>
            <p>
              Este examen tiene <strong>{preguntas.length} {preguntas.length === 1 ? "pregunta" : "preguntas"}</strong> y
              está guardado en este dispositivo hasta el <strong>{formatoFecha(paquete.expira_en)}</strong>, así que puedes
              presentarlo aunque no tengas señal. Mientras lo respondes:
            </p>
            <ul>
              <li>Se abrirá en <strong>pantalla completa</strong>. Si la quitas, las preguntas se ocultarán hasta que regreses.</li>
              <li>Si <strong>cambias de pestaña, minimizas, cierras o recargas</strong> la página, el examen se envía con lo que lleves.</li>
              <li>Si <strong>sales de la ventana</strong> (otra aplicación, Alt+Tab) por más de {SEGUNDOS_FUERA_PERMITIDOS} segundos, también se envía.</li>
              <li>Al terminar el tiempo se envía solo. La calificación la hace el servidor, no tu dispositivo.</li>
              <li>No podrás <strong>seleccionar, copiar, pegar, usar click derecho, imprimir ni tomar capturas</strong>.</li>
              <li>Tu nombre aparecerá como marca de agua sobre el examen.</li>
            </ul>
            <button onClick={comenzar} className="custom-btn btn-enviar">
              Comenzar examen
            </button>
          </div>
        )}
      </div>
    );
  }

  /* EXAMEN EN CURSO */
  const bloqueado = fueraDeFoco || (soportaPantallaCompleta() && !pantallaCompleta);
  const preguntas = paquete?.preguntas || [];

  return (
    <div className="responder-examen examen-en-curso" onContextMenu={(e) => e.preventDefault()}>
      <div className="eo-cabecera">
        <h2>{paquete?.titulo || "Responder Examen"}</h2>
        <span className={`eo-reloj${restanteMs !== null && restanteMs < 60000 ? " eo-reloj-final" : ""}`}>
          {restanteMs !== null ? formatoReloj(restanteMs) : "--:--"}
        </span>
      </div>

      <p className="aviso-examen">
        <strong>Aviso:</strong> si cambias de pestaña, minimizas o sales de la ventana,
        el examen se enviará automáticamente con las respuestas que lleves.
        {faseConexion === "sin_conexion" && " Estás offline: tus respuestas se guardan en el dispositivo."}
      </p>

      <div className={`examen-contenido${bloqueado ? " examen-oculto" : ""}`} aria-hidden={bloqueado}>
        {preguntas.map((p, index) => (
          <div key={p.id} className="pregunta-item">
            <p><strong>{index + 1}. {p.enunciado}</strong></p>

            {(p.opciones || []).length === 0 && (
              <p style={{ color: "red" }}>Esta pregunta no tiene opciones válidas</p>
            )}

            {(p.opciones || []).map((op, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name={`pregunta_${p.id}`}
                  value={op}
                  checked={respuestas[p.id] === op}
                  onChange={() => handleChange(p.id, op)}
                />
                {op}
              </label>
            ))}
          </div>
        ))}

        <button onClick={() => enviar("")} className="custom-btn btn-enviar">
          Enviar Respuestas
        </button>

        <div className="examen-marca-agua" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i}>{marcaDeAgua}</span>
          ))}
        </div>
      </div>

      {/* Capa que tapa las preguntas cuando sale de la ventana o de pantalla completa */}
      {bloqueado && (
        <div className="examen-bloqueo" role="alertdialog" aria-live="assertive">
          {fueraDeFoco ? (
            <>
              <h3>Regresa al examen</h3>
              <p>
                Saliste de la ventana. Si no regresas en {SEGUNDOS_FUERA_PERMITIDOS} segundos,
                el examen se enviará automáticamente.
              </p>
            </>
          ) : (
            <>
              <h3>Saliste de pantalla completa</h3>
              <p>Las preguntas están ocultas. Vuelve a pantalla completa para continuar.</p>
              <button onClick={entrarPantallaCompleta} className="custom-btn btn-enviar">
                Volver a pantalla completa
              </button>
            </>
          )}
        </div>
      )}

      {aviso && <div className="examen-toast" role="status">{aviso}</div>}
    </div>
  );
}

export default ResponderExamen;
