import React, { useEffect, useState } from "react";
import "../vistas/styles/editar.css";

function EditarPerfil() {
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  const usuarioId = usuarioGuardado?.id;

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    foto_perfil: ""
  });

  const [mensaje, setMensaje] = useState(
    usuarioId ? "" : "No se encontró el usuario en sesión"
  );

  useEffect(() => {
    if (!usuarioId) return;

    fetch(`http://127.0.0.1:5000/api/usuarios/${usuarioId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          foto_perfil: data.foto_perfil || ""
        });
      })
      .catch(error => console.error("Error al cargar usuario:", error));
  }, [usuarioId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto_perfil" && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          foto_perfil: reader.result.split(",")[1]
        }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuarioId) {
      setMensaje("No se encontró el usuario en sesión");
      return;
    }

    fetch(`http://127.0.0.1:5000/api/usuarios/${usuarioId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        setMensaje(data.mensaje);

        // 🔹 Guardar usuario actualizado en localStorage
        const usuarioActualizado = {
          ...usuarioGuardado,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          foto_perfil: formData.foto_perfil
        };
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      })
      .catch(() => setMensaje("Error al actualizar usuario"));
  };

  return (
    <div className="editar-perfil">
      <h2>Editar Perfil</h2>
      <form onSubmit={handleSubmit}>
        <label>Nombre:
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
        </label>
        <label>Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </label>
        <label>Teléfono:
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
        </label>
        <label>Foto de perfil:
          <input type="file" name="foto_perfil" accept="image/*" onChange={handleChange} />
        </label>
        {formData.foto_perfil && (
          <img
            src={`data:image/png;base64,${formData.foto_perfil}`}
            alt="Vista previa"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
        )}
        <button type="submit">Guardar cambios</button>
      </form>
      {mensaje && (
                <div className="mensaje-overlay">
                    <div className="mensaje-contenido">
                    <h2>{mensaje}</h2>
                    <button onClick={() => setMensaje("")}>Cerrar</button>
                    </div>
                </div>
                )}
    </div>
  );
}

export default EditarPerfil;