import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario } from "../service/api";
import "./styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [mensaje, setMensaje] = useState("");
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
        // 🔹 Guardar token y banderas de autenticación
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("acceptedTerms", "true");

        // 🔹 Guardar rol
        localStorage.setItem("rol", response.data.usuario.rol);

        // 🔹 Guardar usuario completo
        localStorage.setItem("usuario", JSON.stringify(response.data.usuario));

        setMensaje("Login exitoso ✅");

        // 🔹 Redirigir según rol
        if (response.data.usuario.rol === "administrador") {
          navigate("/admin");
        } else if (response.data.usuario.rol === "profesor") {
          navigate("/profesor");
        } else {
          navigate("/principal");
        }
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
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>
        <br />
        <Link to="/"><button>Regresar a la página principal</button></Link>
        {mensaje && <p>{mensaje}</p>}
        <Link to="/register" className="curso-link">¿No tienes cuenta?</Link>
      </div>
    </div>
  );
};

export default Login;