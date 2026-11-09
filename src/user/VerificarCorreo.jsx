import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./styles/login.css";
import "../temas/temas.css";
import Logo from "../componentes/Logo";
import { verificarCorreo } from "../service/api";

// Página a la que llega el usuario desde el enlace del correo
function VerificarCorreo() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [estado, setEstado] = useState(token ? "cargando" : "error");
  const [mensaje, setMensaje] = useState(token ? "" : "El enlace no es válido.");
  const enviado = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "light");
    if (!token || enviado.current) return;
    enviado.current = true; // evita confirmar dos veces en modo desarrollo

    verificarCorreo(token)
      .then(res => { setEstado("ok"); setMensaje(res.data?.mensaje || "¡Correo confirmado!"); })
      .catch(err => { setEstado("error"); setMensaje(err.response?.data?.mensaje || "No se pudo confirmar el correo."); });
  }, [token]);

  return (
    <div className="login-container">
      <div className="login-box auth-estado">
        <Link to="/" className="auth-logo" aria-label="Volver al inicio">
          <Logo variante="banner" />
        </Link>

        {estado === "cargando" && (
          <>
            <div className="auth-icono auth-icono--girando" aria-hidden="true">⏳</div>
            <h2>Confirmando tu correo...</h2>
          </>
        )}

        {estado === "ok" && (
          <>
            <div className="auth-icono" aria-hidden="true">✅</div>
            <h2>¡Listo!</h2>
            <p className="auth-aviso auth-aviso--ok">{mensaje}</p>
            <Link to="/login"><button type="button">Iniciar sesión</button></Link>
          </>
        )}

        {estado === "error" && (
          <>
            <div className="auth-icono" aria-hidden="true">⚠️</div>
            <h2>No pudimos confirmar tu correo</h2>
            <p className="auth-aviso auth-aviso--error">{mensaje}</p>
            <p className="auth-detalle">
              Inicia sesión con tu correo y contraseña: ahí podrás pedir un nuevo enlace de confirmación.
            </p>
            <Link to="/login"><button type="button">Ir a iniciar sesión</button></Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificarCorreo;
