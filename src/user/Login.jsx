import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario, reenviarVerificacion } from "../service/api";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import AuthLayout from "./AuthLayout";
import BotonGoogle from "../componentes/BotonGoogle";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [sinVerificar, setSinVerificar] = useState(""); // correo pendiente de confirmar
  const [aviso, setAviso] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const response = await loginUsuario(formData);
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("acceptedTerms", "true");
        localStorage.setItem("rol", response.data.usuario.rol);
        localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
        localStorage.setItem("user_id", response.data.usuario.id);

        setMensaje("");

        if (response.data.usuario.rol === "administrador") navigate("/admin");
        else if (response.data.usuario.rol === "profesor") navigate("/profesor");
        else navigate("/principal");
      }
    } catch (error) {
      setSinVerificar(error.response?.data?.codigo === "correo_no_verificado" ? (error.response.data.email || formData.email) : "");
      setAviso("");
      setMensaje(error.response?.data?.mensaje || "Error al iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    try {
      const res = await reenviarVerificacion(sinVerificar);
      setAviso(res.data?.mensaje || "Correo reenviado.");
    } catch (error) {
      setAviso(error.response?.data?.mensaje || "No se pudo reenviar el correo.");
    }
  };

  return (
    <AuthLayout titulo="Bienvenido de nuevo" subtitulo="Inicia sesión para continuar con tus cursos.">
      <form className="au-form" onSubmit={handleSubmit}>
        <label className="au-campo">
          <span className="au-campo__etiqueta">Correo electrónico</span>
          <span className="au-campo__control">
            <FaEnvelope className="au-campo__icono" aria-hidden="true" />
            <input
              type="email"
              name="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </span>
        </label>

        <label className="au-campo">
          <span className="au-campo__etiqueta">
            Contraseña
            <Link to="/recuperar" className="au-enlace au-enlace--chico">¿La olvidaste?</Link>
          </span>
          <span className="au-campo__control">
            <FaLock className="au-campo__icono" aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="au-ojo"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </span>
        </label>

        {mensaje && <p className="au-aviso au-aviso--error" role="alert">{mensaje}</p>}
        {sinVerificar && (
          <div className="au-aviso au-aviso--info">
            <span>Confirma tu correo para poder entrar.</span>
            <button type="button" className="au-enlace" onClick={reenviar}>Reenviar correo de confirmación</button>
            {aviso && <span>{aviso}</span>}
          </div>
        )}

        <button type="submit" className="au-boton" disabled={enviando}>
          {enviando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="au-google">
        <BotonGoogle texto="signin_with" />
      </div>

      <p className="au-cambio">
        ¿No tienes cuenta? <Link to="/register" className="au-enlace">Crea una gratis</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
