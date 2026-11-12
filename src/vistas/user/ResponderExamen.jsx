import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/EstilosAlumno.css";
import { API_URL } from "../../config";

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
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [motivoAuto, setMotivoAuto] = useState("");

  // Protección del examen
  const [iniciado, setIniciado] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [fueraDeFoco, setFueraDeFoco] = useState(false);
  const [aviso, setAviso] = useState("");

  // Refs para leer siempre el valor más reciente dentro de los listeners
  const respuestasRef = useRef({});
  const enviadoRef = useRef(false);
  const preguntasRef = useRef([]);
  const temporizadorFueraRef = useRef(null);
  const temporizadorAvisoRef = useRef(null);
  const iniciadoRef = useRef(false);
  const enviarRef = useRef(null);

  const usuario = leerUsuario();
  const marcaDeAgua = [usuario.nombre, usuario.email].filter(Boolean).join(" · ") || "DevRootDark";

  useEffect(() => { respuestasRef.current = respuestas; }, [respuestas]);
  useEffect(() => { preguntasRef.current = preguntas; }, [preguntas]);

  /* CARGAR PREGUNTAS */

  useEffect(() => {
    if (!examenId) return;

    const fetchPreguntas = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/preguntas/examen/${examenId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        setPreguntas(res.data || []);
      } catch (err) {
        console.error("Error al cargar preguntas:", err);
        alert("No se pudieron cargar las preguntas");
      } finally {
        setLoading(false);
      }
    };

    fetchPreguntas();
  }, [examenId]);

  const handleChange = (preguntaId, opcion) => {
    if (enviadoRef.current) return;
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }));
  };

  const mostrarAviso = useCallback((texto) => {
    setAviso(texto);
    clearTimeout(temporizadorAvisoRef.current);
    temporizadorAvisoRef.current = setTimeout(() => setAviso(""), 2500);
  }, []);

  /* ENVIAR (manual o automático) */

  const enviar = useCallback(async (motivo = "") => {
    const automatico = Boolean(motivo);

    // Evita enviar dos veces o antes de que carguen las preguntas
    if (enviadoRef.current || preguntasRef.current.length === 0) return;

    const respuestasActuales = respuestasRef.current;

    // Envío manual: exige responder todo. Automático: manda lo que haya.
    if (!automatico && Object.keys(respuestasActuales).length !== preguntasRef.current.length) {
      alert("Debes responder todas las preguntas");
      return;
    }

    enviadoRef.current = true;
    clearTimeout(temporizadorFueraRef.current);
    setEnviado(true);
    setMotivoAuto(motivo);

    if (estaEnPantallaCompleta()) {
      document.exitFullscreen?.().catch(() => {});
    }

    try {
      const res = await axios.post(
        `${API_URL}/respuestas`,
        {
          alumno_id: leerUsuario().id,
          examen_id: examenId,
          respuestas: respuestasActuales
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      setResultado(res.data.calificacion);
    } catch (err) {
      console.error(err);
      // Permite reintentar solo si fue un envío manual
      if (!automatico) {
        enviadoRef.current = false;
        setEnviado(false);
      }
      alert("Error al enviar respuestas");
    }
  }, [examenId]);

  useEffect(() => { enviarRef.current = enviar; }, [enviar]);
  useEffect(() => { iniciadoRef.current = iniciado; }, [iniciado]);

  /* INICIAR EN PANTALLA COMPLETA */

  const entrarPantallaCompleta = async () => {
    if (!soportaPantallaCompleta()) return;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (err) {
      console.error("No se pudo activar pantalla completa:", err);
    }
  };

  const comenzar = async () => {
    await entrarPantallaCompleta();
    setIniciado(true);
  };

  /* PROTECCIONES MIENTRAS EL EXAMEN ESTÁ EN CURSO */

  useEffect(() => {
    if (!iniciado || enviado) return;

    // 1. Cambiar de pestaña o minimizar: se envía de inmediato
    const alCambiarVisibilidad = () => {
      if (document.hidden) enviar("Cambiaste de pestaña o minimizaste la ventana.");
    };

    // 2. Salir de la ventana (Alt+Tab, otra app, herramienta de recortes): se ocultan las
    //    preguntas y, si no regresa en unos segundos, se envía
    const alPerderFoco = () => {
      setFueraDeFoco(true);
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
    const alCambiarPantallaCompleta = () => setPantallaCompleta(estaEnPantallaCompleta());

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
      mostrarAviso(motivo);
    };

    // La tecla Impr Pant no se puede cancelar: borramos lo que haya quedado en el portapapeles
    const alSoltarTecla = (e) => {
      if ((e.key || "").toLowerCase() === "printscreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        mostrarAviso("Las capturas de pantalla están bloqueadas.");
      }
    };

    // 6. Imprimir desde el menú del navegador
    const alImprimir = () => mostrarAviso("Imprimir está bloqueado durante el examen.");

    // 7. Cerrar o recargar la página
    const antesDeSalir = (e) => {
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

    alCambiarPantallaCompleta();

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
  }, [iniciado, enviado, enviar, mostrarAviso]);

  // Si sale de la página del examen (por ejemplo, con el menú lateral), se envía y se quita pantalla completa
  useEffect(() => () => {
    clearTimeout(temporizadorAvisoRef.current);
    if (iniciadoRef.current && !enviadoRef.current) {
      enviarRef.current?.("Saliste de la página del examen.");
    }
    if (estaEnPantallaCompleta()) document.exitFullscreen?.().catch(() => {});
  }, []);

  if (loading) return <p>Cargando preguntas...</p>;

  /* PANTALLA DE RESULTADO */

  if (enviado) {
    return (
      <div className="responder-examen">
        <h2>Examen enviado</h2>

        {motivoAuto && (
          <p className="pf-error" style={{ marginBottom: "1rem" }}>
            {motivoAuto} Por eso el examen se envió automáticamente con las respuestas que tenías.
          </p>
        )}

        <div className="resultado-card">
          <p>Calificación</p>
          <p>{resultado !== null ? `${resultado}` : "Calculando..."}</p>
        </div>
      </div>
    );
  }

  /* PANTALLA DE INSTRUCCIONES */

  if (!iniciado) {
    return (
      <div className="responder-examen">
        <h2>Antes de comenzar</h2>

        {preguntas.length === 0 ? (
          <p>No hay preguntas disponibles.</p>
        ) : (
          <div className="examen-reglas">
            <p>
              Este examen tiene <strong>{preguntas.length} {preguntas.length === 1 ? "pregunta" : "preguntas"}</strong>.
              Mientras lo respondes:
            </p>
            <ul>
              <li>Se abrirá en <strong>pantalla completa</strong>. Si la quitas, las preguntas se ocultarán hasta que regreses.</li>
              <li>Si <strong>cambias de pestaña o minimizas</strong> la ventana, el examen se envía de inmediato.</li>
              <li>Si <strong>sales de la ventana</strong> (otra aplicación, Alt+Tab) por más de {SEGUNDOS_FUERA_PERMITIDOS} segundos, también se envía.</li>
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

  const bloqueado = fueraDeFoco || (soportaPantallaCompleta() && !pantallaCompleta);

  return (
    <div className="responder-examen examen-en-curso" onContextMenu={(e) => e.preventDefault()}>
      <h2>Responder Examen</h2>

      <p className="aviso-examen">
        <strong>Aviso:</strong> si cambias de pestaña, minimizas o sales de la ventana,
        el examen se enviará automáticamente con las respuestas que lleves.
      </p>

      <div className={`examen-contenido${bloqueado ? " examen-oculto" : ""}`} aria-hidden={bloqueado}>
        {preguntas.map((p, index) => {
          const opcionesValidas = (p.opciones || []).filter(op => op && op.trim() !== "");

          return (
            <div key={p.id} className="pregunta-item">
              <p><strong>{index + 1}. {p.enunciado}</strong></p>

              {opcionesValidas.length === 0 && (
                <p style={{ color: "red" }}>Esta pregunta no tiene opciones válidas</p>
              )}

              {opcionesValidas.map((op, i) => (
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
          );
        })}

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
