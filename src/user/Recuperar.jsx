import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import AuthLayout from "./AuthLayout";
import { API_URL } from "../config";

const PASOS = ["Correo", "Pregunta", "Nueva contraseña"];

const Recuperar = () => {
  const [email, setEmail] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [paso, setPaso] = useState(1); // 1: email, 2: pregunta, 3: nueva contraseña
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  const navigate = useNavigate();

  //  Enviar email y obtener pregunta
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.post(`${API_URL}/recuperar/pregunta`, { email });
      setPregunta(res.data.pregunta_seguridad);
      setUsuarioId(res.data.usuario_id);
      setPaso(2);
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.mensaje || "Error al buscar usuario");
    }
  };

  //  Verificar respuesta de seguridad
  const handleRespuestaSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.post(`${API_URL}/recuperar/verificar`, {
        usuario_id: usuarioId,
        respuesta
      });
      if (res.data.mensaje === "Respuesta correcta") {
        setPaso(3);
      } else {
        setMensaje(res.data.mensaje);
      }
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.mensaje || "Error al verificar respuesta");
    }
  };

  //  Actualizar contraseña (requiere también la respuesta)
  const handleNuevaPasswordSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.put(`${API_URL}/recuperar/reset`, {
        usuario_id: usuarioId,
        nueva_password: nuevaPassword,
        respuesta
      });
      if (res.status === 200) {
        setExito(true);
        setMensaje("Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.mensaje || "Error al actualizar contraseña");
    }
  };

  return (
    <AuthLayout titulo="Recupera tu contraseña" subtitulo="Responde tu pregunta de seguridad para crear una nueva.">
      <ol className="au-pasos">
        {PASOS.map((nombre, i) => (
          <li key={nombre} className={i + 1 < paso ? "au-pasos--hecho" : i + 1 === paso ? "au-pasos--actual" : ""}>
            <span>{i + 1}</span>{nombre}
          </li>
        ))}
      </ol>

      {paso === 1 && (
        <form className="au-form" onSubmit={handleEmailSubmit}>
          <label className="au-campo">
            <span className="au-campo__etiqueta">Correo electrónico</span>
            <span className="au-campo__control">
              <FaEnvelope className="au-campo__icono" aria-hidden="true" />
              <input type="email" placeholder="tu@correo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </span>
          </label>
          {mensaje && <p className="au-aviso au-aviso--error" role="alert">{mensaje}</p>}
          <button type="submit" className="au-boton">Continuar</button>
        </form>
      )}

      {paso === 2 && (
        <form className="au-form" onSubmit={handleRespuestaSubmit}>
          <div className="au-aviso au-aviso--info">
            <span>Pregunta de seguridad</span>
            <strong>{pregunta}</strong>
          </div>
          <label className="au-campo">
            <span className="au-campo__etiqueta">Tu respuesta</span>
            <input type="text" placeholder="Escribe tu respuesta" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} required />
          </label>
          {mensaje && <p className="au-aviso au-aviso--error" role="alert">{mensaje}</p>}
          <button type="submit" className="au-boton">Verificar respuesta</button>
        </form>
      )}

      {paso === 3 && (
        <form className="au-form" onSubmit={handleNuevaPasswordSubmit}>
          <label className="au-campo">
            <span className="au-campo__etiqueta">Nueva contraseña</span>
            <span className="au-campo__control">
              <FaLock className="au-campo__icono" aria-hidden="true" />
              <input type="password" placeholder="Mínimo 12 caracteres" autoComplete="new-password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required />
            </span>
            <span className="au-campo__ayuda">Usa mayúsculas, minúsculas, números y un símbolo.</span>
          </label>
          {mensaje && <p className={`au-aviso ${exito ? "au-aviso--ok" : "au-aviso--error"}`} role="alert">{mensaje}</p>}
          <button type="submit" className="au-boton" disabled={exito}>Actualizar contraseña</button>
        </form>
      )}

      <p className="au-cambio">
        ¿Ya la recordaste? <Link to="/login" className="au-enlace">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
};

export default Recuperar;
