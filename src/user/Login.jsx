import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario } from "../service/api";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // ✅ íconos de ojo
import "./styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
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
        localStorage.setItem("user_id", response.data.usuario._id);

        setMensaje("Login exitoso ");

        if (response.data.usuario.rol === "administrador") navigate("/admin");
        else if (response.data.usuario.rol === "profesor") navigate("/profesor");
        else navigate("/principal");
      }
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || "Error al iniciar sesión");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
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
        <br />
        <Link to="/"><button>Regresar a la página principal</button></Link>
        {mensaje && <p>{mensaje}</p>}
        <Link to="/register" className="curso-link">¿No tienes cuenta?</Link>
        <Link to="/recuperar" className="curso-link">¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  );
};

export default Login;
