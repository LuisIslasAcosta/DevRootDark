import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSignature, FaCheckCircle, FaPen, FaFont, FaImage } from "react-icons/fa";
import FirmaPad from "../../componentes/FirmaPad";
import FirmaTexto from "../../componentes/FirmaTexto";
import { API_URL } from "../../config";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import "../../componentes/Certificado.css";
import "../../componentes/FirmaPad.css";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MODOS = [
  { id: "escribir", texto: "Escribir", icono: <FaFont /> },
  { id: "dibujar", texto: "Dibujar", icono: <FaPen /> },
  { id: "imagen", texto: "Imagen", icono: <FaImage /> },
];

// Mensaje claro según lo que falló
const explicarError = (err, accion) => {
  if (!err.response) return `No hay conexión con el servidor; no se pudo ${accion} tu firma.`;
  if (err.response.status === 404) return "El servidor todavía no tiene la función de firmas: falta actualizar la API (push del backend y pull en el servidor).";
  if (err.response.status === 401 || err.response.status === 422) return "Tu sesión caducó. Vuelve a iniciar sesión.";
  return err.response.data?.mensaje || `No se pudo ${accion} tu firma.`;
};

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
};

// El profesor registra su firma UNA vez y se pone sola en todos los certificados de sus cursos
function FirmaProfesor() {
  const usuario = leerUsuario();
  const nombre = [usuario.nombre, usuario.apellidop].filter(Boolean).join(" ") || "";

  const [actual, setActual] = useState(null);
  const [huella, setHuella] = useState("");
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [modo, setModo] = useState("escribir");
  const [nueva, setNueva] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: "ok" | "error", texto }

  useEffect(() => {
    axios
      .get(`${API_URL}/firma`, { headers: encabezados() })
      .then((r) => {
        setActual(r.data.firma);
        setHuella(r.data.huella || "");
        setEditando(!r.data.firma);
      })
      .catch((err) => {
        setMensaje({ tipo: "error", texto: explicarError(err, "cargar") });
        setEditando(true);
      })
      .finally(() => setCargando(false));
  }, []);

  const cambiarModo = (m) => {
    setModo(m);
    setNueva(null);
  };

  const guardar = async () => {
    if (!nueva) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const r = await axios.put(`${API_URL}/firma`, { imagen: nueva }, { headers: encabezados() });
      setActual(nueva);
      setHuella(r.data.huella);
      setNueva(null);
      setEditando(false);
      setMensaje({ tipo: "ok", texto: "¡Listo! Tu firma se pondrá automáticamente en todos los certificados de tus cursos." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: explicarError(err, "guardar") });
    } finally {
      setGuardando(false);
    }
  };

  const vistaPrevia = editando ? nueva : actual;

  return (
    <div className="examen-section">
      <h2><FaSignature /> Mi firma</h2>
      <p>
        Firma una sola vez, como cuando firmas un PDF. Tu firma se pone sola en los certificados de los alumnos
        que terminan tus cursos; no tienes que hacer nada más.
      </p>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "firma-msg-ok" : "pf-error"}>
          {mensaje.tipo === "ok" && <FaCheckCircle />} {mensaje.texto}
        </p>
      )}

      {cargando && <p>Cargando...</p>}

      {!cargando && actual && !editando && (
        <div className="firma-activa">
          <FaCheckCircle />
          <p><strong>Tu firma está activa</strong> y ya aparece en tus certificados.</p>
          <button type="button" className="firma-pad-btn" onClick={() => { setEditando(true); setMensaje(null); }}>
            Cambiar firma
          </button>
        </div>
      )}

      {!cargando && editando && (
        <>
          <div className="firma-modos" role="tablist">
            {MODOS.map((m) => (
              <button key={m.id} type="button" role="tab" aria-selected={modo === m.id}
                      className={modo === m.id ? "activo" : ""} onClick={() => cambiarModo(m.id)}>
                {m.icono} {m.texto}
              </button>
            ))}
          </div>

          {modo === "escribir" && <FirmaTexto key="escribir" nombreInicial={nombre} onCambio={setNueva} />}
          {modo === "dibujar" && <FirmaPad key="dibujar" conImagen={false} onCambio={setNueva} />}
          {modo === "imagen" && (
            <>
              <p>Sube una foto o escaneo de tu firma en papel blanco: el fondo se quita solo.</p>
              <FirmaPad key="imagen" onCambio={setNueva} />
            </>
          )}
        </>
      )}

      {!cargando && (
        <>
          <h4 style={{ marginTop: "1.5rem" }}>Así se ve en el certificado</h4>
          <div className="firma-preview">
            {vistaPrevia ? (
              <div className="cert-firma">
                <img className="cert-firma-img" src={vistaPrevia} alt="Vista previa de la firma" />
                <span className="cert-firma-linea" />
                <span className="cert-firma-cargo">{nombre || "Profesor del curso"}</span>
                {!editando && huella && <span className="cert-firma-codigo">Firma {huella}</span>}
              </div>
            ) : (
              <span>{editando ? "Aquí verás tu firma." : "Aún no tienes firma: en el certificado sale tu nombre."}</span>
            )}
          </div>
        </>
      )}

      {editando && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button type="button" className="custom-btn btn-ver" onClick={guardar} disabled={!nueva || guardando}>
            {guardando ? "Guardando..." : "Guardar firma"}
          </button>
          {actual && (
            <button type="button" className="firma-pad-btn" onClick={() => { setEditando(false); setNueva(null); }}>
              Cancelar
            </button>
          )}
        </div>
      )}

      <style>{`
        .firma-preview { container-type: inline-size; max-width: 720px; padding: 1.5rem; border-radius: 14px;
          background: #050608; color: #eef1f6; display: grid; place-items: center; min-height: 140px;
          --cert-oro: #d4a73c; --cert-oro-claro: #f6dc8c; --cert-tenue: #8b93a3; --cert-texto: #eef1f6; --cert-neon: #22e3ff; }
        .firma-preview .cert-firma { width: 60%; }
        .firma-preview .cert-firma-img { height: 18cqw; max-width: 100%; }
        .firma-preview .cert-firma-cargo, .firma-preview .cert-firma-codigo { font-size: 2.6cqw; }
        .firma-preview .cert-firma-linea { max-width: 100%; }
        .firma-msg-ok { color: #15803d; font-weight: 600; display: flex; gap: .4rem; align-items: center; }
      `}</style>
    </div>
  );
}

export default FirmaProfesor;
