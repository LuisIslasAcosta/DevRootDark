import React, { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../config";

// Panel oculto de respaldos. SOLO se compila en la versión del administrador
// (npm run build:reproductor-admin). La versión que se publica para alumnos no lo trae.
//
// - Pide iniciar sesión cada vez: el token vive solo en memoria y se borra al cerrar.
// - Solo funciona con internet: nada de respaldos se guarda ni se encola sin conexión.
// - El servidor vuelve a validar que el usuario sea administrador en cada petición.

const TIPOS = ["completo", "incremental", "diferencial"];

const descargarBlob = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

function PanelSecreto({ onCerrar }) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [respaldos, setRespaldos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [tipo, setTipo] = useState("completo");
  const [archivo, setArchivo] = useState(null);
  const [confirmar, setConfirmar] = useState("");
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [canciones, setCanciones] = useState([]);
  const [archivosMusica, setArchivosMusica] = useState([]);

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

  // Al cerrar el panel se olvida la sesión
  const cerrar = () => {
    setToken("");
    setPassword("");
    onCerrar();
  };

  const llamar = useCallback(async (ruta, opciones = {}) => {
    if (!navigator.onLine) throw new Error("Los respaldos solo funcionan con internet.");
    const res = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      cache: "no-store",
      headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      setToken("");
      throw new Error("La sesión caducó. Vuelve a entrar.");
    }
    if (res.status === 403) throw new Error("Esta cuenta no es de administrador.");
    if (!res.ok) {
      const datos = await res.json().catch(() => ({}));
      throw new Error(datos.message || datos.mensaje || "No se pudo completar la acción.");
    }
    return res;
  }, [token]);

  const cargar = useCallback(async () => {
    try {
      const [lista, bitacora] = await Promise.all([
        llamar("/respaldos").then((r) => r.json()),
        llamar("/respaldos/auditoria?limite=20").then((r) => r.json()),
      ]);
      setRespaldos(Array.isArray(lista) ? lista : []);
      const musica = await fetch(`${API_URL}/musica`, { cache: "no-store" }).then((r) => r.json()).catch(() => []);
      setCanciones(Array.isArray(musica) ? musica : []);
      setAuditoria(Array.isArray(bitacora) ? bitacora : []);
    } catch (err) {
      setMensaje(err.message);
    }
  }, [llamar]);

  useEffect(() => {
    if (token) cargar();
  }, [token, cargar]);

  const entrar = async (e) => {
    e.preventDefault();
    setMensaje("");
    if (!navigator.onLine) {
      setMensaje("Necesitas internet para entrar.");
      return;
    }
    setOcupado("login");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.mensaje || "Correo o contraseña incorrectos");
      if (datos.usuario?.rol !== "administrador") throw new Error("Esta cuenta no es de administrador.");
      setToken(datos.access_token);
      setPassword("");
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setOcupado("");
    }
  };

  const ejecutar = async (accion, fn) => {
    setOcupado(accion);
    setMensaje("");
    try {
      await fn();
      await cargar();
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setOcupado("");
    }
  };

  const generar = () => ejecutar("generar", async () => {
    const blob = await (await llamar(`/respaldo/${tipo}`)).blob();
    descargarBlob(blob, `respaldo-${tipo}.json`);
    setMensaje("Respaldo generado y descargado.");
  });

  const restaurar = () => ejecutar("restaurar", async () => {
    const datos = new FormData();
    datos.append("file", archivo);
    const res = await llamar("/respaldo", { method: "POST", body: datos });
    const r = await res.json().catch(() => ({}));
    setMensaje(r.message || "Base de datos restaurada.");
    setArchivo(null);
    setConfirmar("");
  });

  const subirMusica = () => ejecutar("musica", async () => {
    const datos = new FormData();
    [...archivosMusica].forEach((a) => datos.append("archivos", a));
    const r = await (await llamar("/musica", { method: "POST", body: datos })).json();
    setArchivosMusica([]);
    setMensaje(`Subidas: ${r.guardados.length}${r.rechazados.length ? ` · rechazadas: ${r.rechazados.join(", ")}` : ""}`);
  });

  const quitarCancion = (c) => {
    if (!window.confirm(`¿Quitar "${c.titulo}" de DevRootMusic?`)) return;
    ejecutar("musica", async () => {
      for (const ruta of [c.audio, c.video].filter(Boolean)) {
        await llamar(`/musica/${encodeURIComponent(ruta.replace(/^musica\//, ""))}`, { method: "DELETE" });
      }
    });
  };

  const eliminar = (r) => {
    if (!window.confirm(`¿Eliminar ${r.nombre}? No se puede deshacer.`)) return;
    ejecutar("eliminar", () => llamar(`/respaldo/${r.tipo}/${r.nombre}`, { method: "DELETE" }));
  };

  return (
    <div className="so-panel-fondo" role="dialog" aria-modal="true">
      <div className="so-panel">
        <div className="so-panel-cabecera">
          <strong>Herramientas</strong>
          <button type="button" onClick={cerrar} aria-label="Cerrar">✕</button>
        </div>

        {!enLinea && <p className="so-panel-aviso">Sin conexión: los respaldos solo funcionan con internet.</p>}
        {mensaje && <p className="so-panel-aviso">{mensaje}</p>}

        {!token ? (
          <form onSubmit={entrar} className="so-panel-form">
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="submit" disabled={ocupado === "login" || !enLinea}>{ocupado === "login" ? "Entrando..." : "Entrar"}</button>
          </form>
        ) : (
          <>
            <section>
              <h4>Generar respaldo</h4>
              <div className="so-panel-fila">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={generar} disabled={!!ocupado || !enLinea}>{ocupado === "generar" ? "Generando..." : "Generar y descargar"}</button>
              </div>
            </section>

            <section>
              <h4>Respaldos en el servidor</h4>
              {respaldos.length === 0 ? <small>No hay respaldos.</small> : (
                <ul className="so-panel-lista">
                  {respaldos.map((r) => (
                    <li key={`${r.tipo}-${r.nombre}`}>
                      <span>{r.nombre} <small>({r.tipo})</small></span>
                      <button type="button" onClick={() => eliminar(r)} disabled={!!ocupado || !enLinea}>Eliminar</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4>Restaurar desde archivo</h4>
              <input type="file" accept=".json,application/json" onChange={(e) => setArchivo(e.target.files[0] || null)} />
              {archivo && (
                <div className="so-panel-fila">
                  <input placeholder='Escribe "RESTAURAR"' value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                  <button type="button" onClick={restaurar} disabled={confirmar !== "RESTAURAR" || !!ocupado || !enLinea}>
                    {ocupado === "restaurar" ? "Restaurando..." : "Restaurar"}
                  </button>
                </div>
              )}
            </section>

            <section>
              <h4>Música predeterminada</h4>
              <small>Sube el .mp3 y el .mp4 de cada canción con el mismo nombre; todos los usuarios la verán en DevRootMusic.</small>
              <div className="so-panel-fila">
                <input type="file" multiple accept=".mp3,.m4a,.ogg,.mp4,.webm" onChange={(e) => setArchivosMusica(e.target.files)} />
                <button type="button" onClick={subirMusica} disabled={!archivosMusica.length || !!ocupado || !enLinea}>
                  {ocupado === "musica" ? "Subiendo..." : "Subir"}
                </button>
              </div>
              <ul className="so-panel-lista">
                {canciones.map((c) => (
                  <li key={c.id}>
                    <span>{c.titulo} <small>({[c.audio && "audio", c.video && "video"].filter(Boolean).join(" + ")})</small></span>
                    <button type="button" onClick={() => quitarCancion(c)} disabled={!!ocupado || !enLinea}>Quitar</button>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4>Bitácora</h4>
              <ul className="so-panel-lista so-panel-bitacora">
                {auditoria.map((a, i) => (
                  <li key={i}>
                    <span>{new Date(a.fecha).toLocaleString("es-MX")} · {a.accion} · {a.email || "?"}</span>
                    <small>{a.exito ? "ok" : "denegado"}</small>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default PanelSecreto;
