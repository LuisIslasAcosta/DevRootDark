import React, { useState, useEffect } from "react";
import { registrarUsuario, reenviarVerificacion } from "../service/api";
import { Link } from "react-router-dom";
import Logo from "../componentes/Logo";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // íconos de ojo
import "./styles/login.css"; // usamos el mismo login.css para mantener consistencia

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidop: "",
    apellidom: "",
    fecha_nacimiento: "",
    pais: "",
    ciudad: "",
    email: "",
    password: "",
    verificar_password: "",
    foto_perfil: "",
    pregunta_seguridad: "",
    respuesta_seguridad: "",
    telefono: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("error");
  const [registrado, setRegistrado] = useState(null); // { email, requiere_verificacion, mensaje }
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen" && files.length > 0) {
      setFormData({ ...formData, imagen: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setEnviando(true);
      setMensaje("");
      const response = await registrarUsuario(formData);
      setRegistrado({ email: formData.email, ...response.data });
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(error.response?.data?.mensaje || "Error al registrar usuario");
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    try {
      const res = await reenviarVerificacion(registrado.email);
      setAviso(res.data?.mensaje || "Correo reenviado.");
    } catch (error) {
      setAviso(error.response?.data?.mensaje || "No se pudo reenviar el correo.");
    }
  };

  // Pantalla después de registrarse
  if (registrado) {
    return (
      <div className="login-container">
        <div className="login-box auth-estado">
          <Link to="/" className="auth-logo" aria-label="Volver al inicio">
            <Logo variante="banner" />
          </Link>
          <div className="auth-icono" aria-hidden="true">{registrado.requiere_verificacion ? "✉️" : "✅"}</div>
          <h2>{registrado.requiere_verificacion ? "Revisa tu correo" : "¡Cuenta creada!"}</h2>
          <p className="auth-aviso auth-aviso--ok">{registrado.mensaje}</p>
          {registrado.requiere_verificacion && (
            <>
              <p className="auth-detalle">
                Abre el correo que enviamos a <strong>{registrado.email}</strong> y presiona
                «Confirmar mi correo». El enlace vence en 24 horas.
              </p>
              <button type="button" className="auth-secundario" onClick={reenviar}>Reenviar correo</button>
              {aviso && <p className="auth-aviso">{aviso}</p>}
            </>
          )}
          <Link to="/login"><button type="button">Ir a iniciar sesión</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <Link to="/" className="auth-logo" aria-label="Volver al inicio">
          <Logo variante="banner" />
        </Link>
        <h2>Registro de Usuario</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required />
          <input type="text" name="apellidop" placeholder="Apellido Paterno" onChange={handleChange} required />
          <input type="text" name="apellidom" placeholder="Apellido Materno" onChange={handleChange} required />
          <input type="date" name="fecha_nacimiento" onChange={handleChange} required />
          <input type="text" name="pais" placeholder="País" onChange={handleChange} required />
          <input type="text" name="ciudad" placeholder="Ciudad" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Correo electrónico" onChange={handleChange} required />

          {/* Contraseña con ojo */}
          <div className="input-eye-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              onChange={handleChange}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirmar contraseña con ojo */}
          <div className="input-eye-container">
            <input
              type={showConfirm ? "text" : "password"}
              name="verificar_password"
              placeholder="Confirmar contraseña"
              onChange={handleChange}
              required
            />
            <span onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <input type="file" name="imagen" accept="image/*" onChange={handleChange} />
          <input type="text" name="pregunta_seguridad" placeholder="Pregunta de seguridad" onChange={handleChange} required />
          <input type="text" name="respuesta_seguridad" placeholder="Respuesta de seguridad" onChange={handleChange} required />
          <input type="tel" name="telefono" placeholder="Teléfono" onChange={handleChange} />

          <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? "Creando cuenta..." : "Registrar"}</button>
        </form>
        <br />
        <Link to="/"><button>Regresar a la página principal</button></Link>
        {mensaje && <p className={`auth-aviso auth-aviso--${tipoMensaje}`}>{mensaje}</p>}
        <Link to={`/login`} className="curso-link">¿Ya tienes cuenta?</Link>
      </div>
    </div>
  );
};

export default Registro;
