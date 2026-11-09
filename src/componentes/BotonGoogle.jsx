import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import "./BotonGoogle.css";
import { guardarSesion } from "./sesion";

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const SCRIPT_GOOGLE = "https://accounts.google.com/gsi/client";

// Carga el script oficial de Google una sola vez
let cargaScript = null;
function cargarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!cargaScript) {
    cargaScript = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_GOOGLE;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => { cargaScript = null; reject(new Error("No se pudo cargar Google")); };
      document.head.appendChild(s);
    });
  }
  return cargaScript;
}

/**
 * Botón "Continuar con Google".
 * Necesita VITE_GOOGLE_CLIENT_ID (en Netlify o en el archivo .env); si no existe, no se muestra.
 * texto: "continue_with" | "signin_with" | "signup_with"
 */
function BotonGoogle({ texto = "continue_with" }) {
  const contenedor = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let activo = true;

    const alResponder = async ({ credential }) => {
      setError("");
      setEntrando(true);
      try {
        const res = await axios.post(`${API_URL}/login/google`, { credential });
        guardarSesion(res.data, navigate);
      } catch (err) {
        setError(err.response?.data?.mensaje || "No se pudo iniciar sesión con Google.");
      } finally {
        setEntrando(false);
      }
    };

    cargarGoogle()
      .then(() => {
        if (!activo || !contenedor.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: alResponder,
          ux_mode: "popup",
          context: texto === "signup_with" ? "signup" : "signin",
        });
        const ancho = Math.min(400, Math.max(220, contenedor.current.offsetWidth || 320));
        window.google.accounts.id.renderButton(contenedor.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: texto,
          logo_alignment: "left",
          locale: "es",
          width: ancho,
        });
      })
      .catch(() => activo && setError("No se pudo cargar el botón de Google. Revisa tu conexión."));

    return () => { activo = false; };
  }, [navigate, texto]);

  if (!CLIENT_ID) return null;

  return (
    <div className="boton-google">
      <div className="boton-google__separador"><span>o</span></div>
      <div ref={contenedor} className="boton-google__contenedor" aria-busy={entrando} />
      {entrando && <p className="boton-google__estado">Entrando con Google...</p>}
      {error && <p className="auth-aviso auth-aviso--error">{error}</p>}
    </div>
  );
}

export default BotonGoogle;
