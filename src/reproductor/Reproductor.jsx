import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBackward,
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaFolderOpen,
  FaHeadphones,
  FaForward,
  FaMusic,
  FaPause,
  FaPlay,
  FaRandom,
  FaRedo,
  FaTrashAlt,
  FaVolumeMute,
  FaVolumeUp,
  FaWifi,
  FaVideo,
} from "react-icons/fa";
import {
  borrarDescarga,
  carpetaGuardada,
  descargarVideo,
  desdeArchivos,
  elegirCarpeta,
  estaDescargado,
  haySesion,
  musicaDevRoot,
  pistasDevRoot,
  reconectarCarpeta,
  soportaCarpetas,
  urlLocal,
  videosDeCursos,
} from "./biblioteca";
import "./reproductor.css";

const ICONO_TIPO = { audio: <FaMusic />, video: <FaVideo /> };

// Portada generada a partir del título (cada canción tiene sus propios colores)
const PALETA = [
  ["#ff2e63", "#7c3aed"], ["#06b6d4", "#3b82f6"], ["#f97316", "#db2777"], ["#22c55e", "#0ea5e9"],
  ["#a855f7", "#ec4899"], ["#eab308", "#ef4444"], ["#14b8a6", "#6366f1"], ["#f43f5e", "#f59e0b"],
];
const colores = (texto = "") => {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
};
const iniciales = (t = "") => t.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const formatoTiempo = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

function Portada({ titulo, tipo, tamano = "chica" }) {
  const [a, b] = colores(titulo);
  return (
    <span className={`sp-portada sp-portada-${tamano}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden="true">
      <span>{iniciales(titulo) || "♪"}</span>
      {tipo === "video" && <FaVideo className="sp-portada-video" />}
    </span>
  );
}

const SECCIONES = {
  devroot: { titulo: "DevRootMusic", sub: "Música para concentrarte al máximo mientras aprendes.", colores: ["#ff2e63", "#3b0764"] },
  musica: { titulo: "Mi música", sub: "Canciones y videos de tu dispositivo. Se reproducen sin internet y no se suben a ningún lado.", colores: ["#2563eb", "#0f172a"] },
  cursos: { titulo: "Videos de mis cursos", sub: "Los videos de tus cursos aceptados. Descárgalos para verlos sin conexión.", colores: ["#059669", "#0f172a"] },
};

// `PanelSecreto` solo lo pasa la app de administrador (/reproductor-admin/).
// La app normal (/reproductor/) no lo importa, así que su código ni siquiera se descarga.
function Reproductor({ PanelSecreto = null }) {
  const ES_ADMIN = Boolean(PanelSecreto);
  // La música de DevRootMusic es lo primero que se ve
  const [pestana, setPestana] = useState("devroot");
  const [devrootCrudo, setDevrootCrudo] = useState([]);
  const [estadoDevroot, setEstadoDevroot] = useState("cargando");
  const [conVideo, setConVideo] = useState(false);
  const [locales, setLocales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [descargados, setDescargados] = useState({});
  const [estadoCursos, setEstadoCursos] = useState("");
  const [carpeta, setCarpeta] = useState(null);
  const [cola, setCola] = useState([]);
  const [indice, setIndice] = useState(-1);
  const [src, setSrc] = useState("");
  const [reproduciendo, setReproduciendo] = useState(false);
  const [aleatorio, setAleatorio] = useState(false);
  const [repetir, setRepetir] = useState(false);
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [bajando, setBajando] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [volumen, setVolumen] = useState(0.9);

  const medio = useRef(null);
  const urlAnterior = useRef("");
  const secuencia = useRef({ toques: [], paso: 0, hasta: 0 });

  const pista = cola[indice] || null;

  // ================= CONEXIÓN =================
  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ================= CARPETA RECORDADA =================
  useEffect(() => {
    carpetaGuardada().then(async (c) => {
      if (!c) return;
      if (c.permiso === "granted") {
        try {
          setLocales(await reconectarCarpeta(c.dir));
          return;
        } catch {
          /* se pide de nuevo abajo */
        }
      }
      setCarpeta(c);
    });
  }, []);

  // ================= VIDEOS DE CURSOS =================
  const cargarCursos = useCallback(async () => {
    if (!haySesion()) {
      setEstadoCursos("sin_sesion");
      return;
    }
    setEstadoCursos("cargando");
    try {
      const lista = await videosDeCursos();
      setCursos(lista);
      const marcas = {};
      await Promise.all(lista.map(async (p) => { marcas[p.id] = await estaDescargado(p.url); }));
      setDescargados(marcas);
      setEstadoCursos(lista.length ? "" : "vacio");
    } catch (err) {
      setEstadoCursos(err.sesion ? "sin_sesion" : "error");
    }
  }, []);

  useEffect(() => {
    if (pestana === "cursos") cargarCursos();
  }, [pestana, cargarCursos]);

  // ================= MÚSICA PREDETERMINADA =================
  const devroot = useMemo(() => pistasDevRoot(devrootCrudo, conVideo), [devrootCrudo, conVideo]);

  const cargarDevroot = useCallback(async () => {
    setEstadoDevroot("cargando");
    try {
      const canciones = await musicaDevRoot();
      setDevrootCrudo(canciones);
      setEstadoDevroot(canciones.length ? "" : "vacio");
      // Marca cuáles ya están guardadas para escucharse sin conexión
      const marcas = {};
      await Promise.all([...pistasDevRoot(canciones, false), ...pistasDevRoot(canciones, true)].map(async (p) => {
        marcas[p.id] = await estaDescargado(p.url);
      }));
      setDescargados((d) => ({ ...d, ...marcas }));
    } catch {
      setEstadoDevroot("error");
    }
  }, []);

  useEffect(() => {
    cargarDevroot();
  }, [cargarDevroot]);

  // ================= REPRODUCCIÓN =================
  const reproducir = useCallback(async (lista, i) => {
    const p = lista[i];
    if (!p) return;
    if (p.origen !== "local" && !navigator.onLine && !(await estaDescargado(p.url))) {
      alert("No está descargado. Descárgalo cuando tengas internet para usarlo sin conexión.");
      return;
    }
    if (urlAnterior.current.startsWith("blob:")) URL.revokeObjectURL(urlAnterior.current);
    const url = p.origen === "local" ? await urlLocal(p) : p.url;
    urlAnterior.current = url;
    setCola(lista);
    setIndice(i);
    setSrc(url);
  }, []);

  const siguiente = useCallback((manual = true) => {
    if (!cola.length) return;
    if (aleatorio) return reproducir(cola, Math.floor(Math.random() * cola.length));
    if (indice + 1 < cola.length) return reproducir(cola, indice + 1);
    if (repetir || manual) return reproducir(cola, 0);
    setReproduciendo(false);
  }, [cola, indice, aleatorio, repetir, reproducir]);

  const anterior = useCallback(() => {
    if (!cola.length) return;
    if (medio.current && medio.current.currentTime > 4) {
      medio.current.currentTime = 0;
      return;
    }
    reproducir(cola, indice > 0 ? indice - 1 : cola.length - 1);
  }, [cola, indice, reproducir]);

  useEffect(() => {
    if (src && medio.current) medio.current.play().catch(() => {});
  }, [src]);

  const alternar = () => {
    const m = medio.current;
    if (!m || !src) {
      const lista = pestana === "devroot" ? devroot : pestana === "musica" ? locales : cursos;
      if (lista.length) reproducir(lista, 0);
      return;
    }
    if (m.paused) m.play().catch(() => {});
    else m.pause();
  };

  // Controles en la pantalla de bloqueo y en los audífonos
  useEffect(() => {
    if (!("mediaSession" in navigator) || !pista) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: pista.titulo,
      artist: pista.grupo,
      album: "DevRootMusic",
      artwork: [{ src: "/reproductor/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("previoustrack", anterior);
    navigator.mediaSession.setActionHandler("nexttrack", () => siguiente(true));
  }, [pista, anterior, siguiente]);

  // ================= SECUENCIA SECRETA (solo versión administrador) =================
  // 5 toques al logo en 3 segundos y luego: anterior → siguiente → anterior
  const tocarLogo = () => {
    if (!ES_ADMIN) return;
    const s = secuencia.current;
    const ahora = Date.now();
    s.toques = [...s.toques.filter((t) => ahora - t < 3000), ahora];
    if (s.toques.length >= 5) {
      s.toques = [];
      s.paso = 1;
      s.hasta = ahora + 8000;
    }
  };

  const pasoSecreto = (boton) => {
    if (!ES_ADMIN) return;
    const s = secuencia.current;
    if (!s.paso || Date.now() > s.hasta) {
      s.paso = 0;
      return;
    }
    const esperado = ["anterior", "siguiente", "anterior"][s.paso - 1];
    if (boton !== esperado) {
      s.paso = 0;
      return;
    }
    s.paso += 1;
    if (s.paso > 3) {
      s.paso = 0;
      setPanelAbierto(true);
    }
  };

  // ================= ACCIONES DE BIBLIOTECA =================
  const abrirCarpeta = async () => {
    try {
      setLocales(await elegirCarpeta());
      setCarpeta(null);
    } catch {
      /* el usuario canceló */
    }
  };

  const volverAConectar = async () => {
    try {
      setLocales(await reconectarCarpeta(carpeta.dir));
      setCarpeta(null);
    } catch {
      alert("Necesito permiso para leer la carpeta.");
    }
  };

  const alternarDescarga = async (p) => {
    setBajando(p.id);
    try {
      if (descargados[p.id]) await borrarDescarga(p.url);
      else await descargarVideo(p.url);
      setDescargados((d) => ({ ...d, [p.id]: !d[p.id] }));
    } catch {
      alert("No se pudo descargar. Revisa tu conexión.");
    } finally {
      setBajando("");
    }
  };

  const lista = pestana === "devroot" ? devroot : pestana === "musica" ? locales : cursos;
  const seccion = SECCIONES[pestana];
  const esVideo = pista?.tipo === "video";

  const buscar = (valor) => {
    const m = medio.current;
    if (m?.duration) m.currentTime = (Number(valor) / 1000) * m.duration;
  };

  const cambiarVolumen = (v) => {
    setVolumen(v);
    if (medio.current) medio.current.volume = v;
  };

  const botonDescarga = (p) => (
    <button
      type="button"
      className={`sp-icono-btn ${descargados[p.id] ? "sp-descargado" : ""}`}
      onClick={(e) => { e.stopPropagation(); alternarDescarga(p); }}
      disabled={bajando === p.id || (!enLinea && !descargados[p.id])}
      title={descargados[p.id] ? "Disponible sin conexión (toca para borrar)" : "Descargar para escuchar sin conexión"}
      aria-label={descargados[p.id] ? "Borrar descarga" : "Descargar"}
    >
      {bajando === p.id ? <span className="sp-girando" /> : descargados[p.id] ? <FaCheckCircle /> : <FaCloudDownloadAlt />}
    </button>
  );

  const navegacion = [
    { id: "devroot", texto: "DevRootMusic", icono: <FaHeadphones /> },
    { id: "musica", texto: "Mi música", icono: <FaMusic /> },
    { id: "cursos", texto: "Videos de mis cursos", icono: <FaVideo /> },
  ];

  return (
    <div className={`sp ${pista ? "sp-con-barra" : ""}`}>
      {/* ================= MENÚ LATERAL ================= */}
      <aside className="sp-lateral">
        <button type="button" className="sp-logo" onClick={tocarLogo} aria-label="DevRootMusic">
          <img src="/reproductor/icons/icon-192.png" alt="" />
          <span>DevRootMusic</span>
        </button>
        <nav className="sp-nav">
          {navegacion.map((n) => (
            <button key={n.id} type="button" className={pestana === n.id ? "activa" : ""} onClick={() => setPestana(n.id)}>
              {n.icono} <span>{n.texto}</span>
            </button>
          ))}
        </nav>
        <span className={`sp-red ${enLinea ? "" : "sp-red-off"}`}>
          <FaWifi /> {enLinea ? "En línea" : "Sin conexión"}
        </span>
      </aside>

      {/* ================= CONTENIDO ================= */}
      <main className="sp-principal">
        <header className="sp-hero" style={{ "--sp-hero-a": seccion.colores[0], "--sp-hero-b": seccion.colores[1] }}>
          <div className="sp-hero-portada">
            {pestana === "devroot" ? <FaHeadphones /> : pestana === "musica" ? <FaMusic /> : <FaVideo />}
          </div>
          <div className="sp-hero-texto">
            <span className="sp-hero-tipo">Playlist</span>
            <h1>{seccion.titulo}</h1>
            <p>{seccion.sub}</p>
            <small>{lista.length} {lista.length === 1 ? "elemento" : "elementos"}</small>
          </div>
        </header>

        <div className="sp-acciones">
          <button type="button" className="sp-play-grande" onClick={alternar} disabled={!lista.length && !src}
                  aria-label={reproduciendo ? "Pausa" : "Reproducir"}>
            {reproduciendo ? <FaPause /> : <FaPlay />}
          </button>
          <button type="button" className={`sp-icono-btn sp-grande ${aleatorio ? "activo" : ""}`} onClick={() => setAleatorio((v) => !v)} aria-label="Aleatorio" title="Aleatorio">
            <FaRandom />
          </button>

          {pestana === "devroot" && (
            <div className="sp-chips" role="radiogroup" aria-label="Escuchar o ver">
              <button type="button" role="radio" aria-checked={!conVideo} className={!conVideo ? "activo" : ""} onClick={() => setConVideo(false)}>
                <FaHeadphones /> Solo audio
              </button>
              <button type="button" role="radio" aria-checked={conVideo} className={conVideo ? "activo" : ""} onClick={() => setConVideo(true)}>
                <FaVideo /> Con video
              </button>
            </div>
          )}

          {pestana === "musica" && (
            <div className="sp-chips">
              {soportaCarpetas() && <button type="button" onClick={abrirCarpeta}><FaFolderOpen /> Elegir carpeta</button>}
              <label>
                <FaFolderOpen /> Agregar archivos
                <input type="file" multiple accept="audio/*,video/*" hidden
                       onChange={(e) => setLocales((prev) => [...prev, ...desdeArchivos(e.target.files)])} />
              </label>
              {carpeta && <button type="button" onClick={volverAConectar}>Volver a abrir “{carpeta.nombre}”</button>}
            </div>
          )}
        </div>

        {/* El mismo elemento reproduce audio y video; solo se muestra cuando es video */}
        <div className={`sp-video ${esVideo ? "visible" : ""}`}>
          <video
            ref={medio}
            src={src || undefined}
            playsInline
            onClick={alternar}
            onPlay={() => setReproduciendo(true)}
            onPause={() => setReproduciendo(false)}
            onLoadedMetadata={(e) => { setDuracion(e.target.duration); e.target.volume = volumen; }}
            onTimeUpdate={(e) => setTiempo(e.target.currentTime)}
            onEnded={() => (repetir && cola.length === 1 ? reproducir(cola, indice) : siguiente(false))}
          />
        </div>

        {pestana === "devroot" && estadoDevroot === "cargando" && <p className="sp-vacio">Cargando música...</p>}
        {pestana === "devroot" && estadoDevroot === "vacio" && <p className="sp-vacio">Todavía no hay canciones.</p>}
        {pestana === "devroot" && estadoDevroot === "error" && (
          <p className="sp-vacio">No se pudo cargar la música{enLinea ? "" : " (sin conexión)"}. <button type="button" onClick={cargarDevroot}>Reintentar</button></p>
        )}
        {pestana === "musica" && !locales.length && (
          <p className="sp-vacio">Agrega tus canciones o videos: se quedan en tu dispositivo y funcionan sin internet.</p>
        )}
        {pestana === "cursos" && estadoCursos === "sin_sesion" && (
          <p className="sp-vacio">Inicia sesión en la plataforma de cursos en este navegador para ver aquí los videos de tus cursos aceptados.</p>
        )}
        {pestana === "cursos" && estadoCursos === "cargando" && <p className="sp-vacio">Cargando videos...</p>}
        {pestana === "cursos" && estadoCursos === "vacio" && <p className="sp-vacio">Tus cursos aceptados aún no tienen videos.</p>}
        {pestana === "cursos" && estadoCursos === "error" && (
          <p className="sp-vacio">No se pudieron cargar los videos{enLinea ? "" : " (sin conexión)"}. <button type="button" onClick={cargarCursos}>Reintentar</button></p>
        )}

        {lista.length > 0 && (
          <ol className="sp-lista">
            <li className="sp-lista-cabecera" aria-hidden="true">
              <span>#</span><span>Título</span><span className="sp-col-grupo">Álbum</span><span />
            </li>
            {lista.map((p, i) => {
              const sonando = pista?.id === p.id;
              return (
                <li key={p.id} className={`sp-fila ${sonando ? "sonando" : ""}`} onDoubleClick={() => reproducir(lista, i)}>
                  <button type="button" className="sp-fila-num" onClick={() => reproducir(lista, i)} aria-label={`Reproducir ${p.titulo}`}>
                    {sonando && reproduciendo ? (
                      <span className="sp-barras" aria-hidden="true"><i /><i /><i /></span>
                    ) : (
                      <>
                        <span className="sp-numero">{i + 1}</span>
                        <FaPlay className="sp-play-fila" />
                      </>
                    )}
                  </button>
                  <button type="button" className="sp-fila-titulo" onClick={() => reproducir(lista, i)}>
                    <Portada titulo={p.titulo} tipo={p.tipo} />
                    <span>
                      <strong>{p.titulo}</strong>
                      <small>{ICONO_TIPO[p.tipo]} {p.tipo === "video" ? "Video" : "Audio"}</small>
                    </span>
                  </button>
                  <span className="sp-col-grupo">{p.grupo}</span>
                  <span className="sp-fila-acciones">{p.origen !== "local" && botonDescarga(p)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </main>

      {/* ================= BARRA DE REPRODUCCIÓN ================= */}
      <footer className="sp-barra">
        <div className="sp-barra-pista">
          {pista ? (
            <>
              <Portada titulo={pista.titulo} tipo={pista.tipo} tamano="mediana" />
              <span>
                <strong>{pista.titulo}</strong>
                <small>{pista.grupo}</small>
              </span>
            </>
          ) : (
            <span className="sp-barra-vacia">Elige una canción</span>
          )}
        </div>

        <div className="sp-barra-centro">
          <div className="sp-controles">
            <button type="button" className={`sp-icono-btn ${aleatorio ? "activo" : ""}`} onClick={() => setAleatorio((v) => !v)} aria-label="Aleatorio"><FaRandom /></button>
            <button type="button" className="sp-icono-btn" onClick={() => { pasoSecreto("anterior"); anterior(); }} aria-label="Anterior"><FaBackward /></button>
            <button type="button" className="sp-play" onClick={alternar} aria-label={reproduciendo ? "Pausa" : "Reproducir"}>
              {reproduciendo ? <FaPause /> : <FaPlay />}
            </button>
            <button type="button" className="sp-icono-btn" onClick={() => { pasoSecreto("siguiente"); siguiente(true); }} aria-label="Siguiente"><FaForward /></button>
            <button type="button" className={`sp-icono-btn ${repetir ? "activo" : ""}`} onClick={() => setRepetir((v) => !v)} aria-label="Repetir"><FaRedo /></button>
          </div>
          <div className="sp-progreso">
            <span>{formatoTiempo(tiempo)}</span>
            <input
              type="range"
              min="0"
              max="1000"
              value={duracion ? Math.round((tiempo / duracion) * 1000) : 0}
              onChange={(e) => buscar(e.target.value)}
              style={{ "--sp-avance": `${duracion ? (tiempo / duracion) * 100 : 0}%` }}
              aria-label="Avance"
              disabled={!src}
            />
            <span>{formatoTiempo(duracion)}</span>
          </div>
        </div>

        <div className="sp-barra-volumen">
          <button type="button" className="sp-icono-btn" onClick={() => cambiarVolumen(volumen > 0 ? 0 : 0.9)} aria-label="Silenciar">
            {volumen > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={volumen} onChange={(e) => cambiarVolumen(Number(e.target.value))}
                 style={{ "--sp-avance": `${volumen * 100}%` }} aria-label="Volumen" />
        </div>
      </footer>

      {ES_ADMIN && panelAbierto && (
        <Suspense fallback={null}>
          <PanelSecreto onCerrar={() => setPanelAbierto(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default Reproductor;
