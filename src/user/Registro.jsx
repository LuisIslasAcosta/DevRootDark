import React, { useState, useEffect } from "react";
import { registrarUsuario } from "../service/api";
import { Link } from "react-router-dom";
import "./styles/registro.css";

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

  const [theme, ] = useState(() => localStorage.getItem("theme") || "light");

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
      const response = await registrarUsuario(formData);
      setMensaje(response.data.mensaje);
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || "Error al registrar usuario");
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-box">
        <h2>Registro de Usuario</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required />
          <input type="text" name="apellidop" placeholder="Apellido Paterno" onChange={handleChange} required />
          <input type="text" name="apellidom" placeholder="Apellido Materno" onChange={handleChange} required />
          <input type="date" name="fecha_nacimiento" onChange={handleChange} required />
          <input type="text" name="pais" placeholder="País" onChange={handleChange} required />
          <input type="text" name="ciudad" placeholder="Ciudad" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Correo electrónico" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
          <input type="password" name="verificar_password" placeholder="Confirmar contraseña" onChange={handleChange} required />
          <input type="file" name="imagen" accept="image/*" onChange={handleChange} />
          <input type="text" name="pregunta_seguridad" placeholder="Pregunta de seguridad" onChange={handleChange} required />
          <input type="text" name="respuesta_seguridad" placeholder="Respuesta de seguridad" onChange={handleChange} required />
          <input type="tel" name="telefono" placeholder="Teléfono" onChange={handleChange} />

          <button type="submit">Registrar</button>
        </form>
        <br />
      <Link to="/"> <button>Regresar a la página principal</button></Link>
        {mensaje && <p>{mensaje}</p>}
        <Link to={`/login`} className="curso-link">¿Ya tienes cuenta?</Link>
      </div>
    </div>
  );
};

export default Registro;