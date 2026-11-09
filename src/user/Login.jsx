import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario, reenviarVerificacion } from "../service/api";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // íconos de ojo
import "./styles/login.css";
import Logo from "../componentes/Logo";
import BotonGoogle from "../componentes/BotonGoogle";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [sinVerificar, setSinVerificar] = useState(""); // correo pendiente de confirmar
  const [aviso, setAviso] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="login-container">
      <div className="login-box">
        <Link to="/" className="auth-logo" aria-label="Volver al inicio">
          <Logo variante="banner" />
        </Link>
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            onChange={handleChange}
            required
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              onChange={handleChange}
              required
              style={{ paddingRight: "40px" }} // espacio para el ícono
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#555"
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit">Login</button>
        </form>
        <BotonGoogle texto="signin_with" />
        <br />
        <Link to="/"><button>Regresar a la página principal</button></Link>
        {mensaje && <p className="auth-aviso auth-aviso--error">{mensaje}</p>}
        {sinVerificar && (
          <>
            <button type="button" className="auth-secundario" onClick={reenviar}>
              Reenviar correo de confirmación
            </button>
            {aviso && <p className="auth-aviso">{aviso}</p>}
          </>
        )}
        <Link to="/register" className="curso-link">¿No tienes cuenta?</Link>
        <Link to="/recuperar" className="curso-link">¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  );
};

export default Login;
