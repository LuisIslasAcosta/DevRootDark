import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/login.css";

const Recuperar = () => {
  const [email, setEmail] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [paso, setPaso] = useState(1); // 1: email, 2: pregunta, 3: nueva contraseña
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  // 1️⃣ Enviar email y obtener pregunta
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/recuperar/pregunta", { email });
      setPregunta(res.data.pregunta_seguridad);
      setUsuarioId(res.data.usuario_id);
      setPaso(2);
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.mensaje || "Error al buscar usuario");
    }
  };

  // 2️⃣ Verificar respuesta de seguridad
  const handleRespuestaSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/recuperar/verificar", {
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

  // 3️⃣ Actualizar contraseña (ahora requiere respuesta también)
  const handleNuevaPasswordSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const res = await axios.put("http://127.0.0.1:5000/api/recuperar/reset", {
        usuario_id: usuarioId,
        nueva_password: nuevaPassword,
        respuesta // ✅ enviar la respuesta de seguridad al reset
      });
      if (res.status === 200) {
        setMensaje("Contraseña actualizada correctamente. Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.mensaje || "Error al actualizar contraseña");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Recuperar Contraseña</h2>

        {paso === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Enviar correo</button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={handleRespuestaSubmit}>
            <p><strong>Pregunta de seguridad:</strong> {pregunta}</p>
            <input
              type="text"
              placeholder="Tu respuesta"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              required
            />
            <button type="submit">Verificar respuesta</button>
          </form>
        )}

        {paso === 3 && (
          <form onSubmit={handleNuevaPasswordSubmit}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
            />
            <button type="submit">Actualizar contraseña</button>
          </form>
        )}

        {mensaje && <p className="text-danger">{mensaje}</p>}

        <button onClick={() => navigate("/login")} className="mt-2">
          Regresar al login
        </button>
      </div>
    </div>
  );
};

export default Recuperar;
