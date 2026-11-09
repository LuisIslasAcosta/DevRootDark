import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCamera, FaArrowLeft } from "react-icons/fa";
import "../vistas/styles/editar.css";

const API = "https://defense-situation-bouquet-aqua.trycloudflare.com//api";
const MAX_FOTO_MB = 2;

const vacio = { nombre: "", email: "", telefono: "", foto_perfil: "" };

// La foto puede venir con o sin el prefijo "data:image"
const srcFoto = (foto) =>
  foto ? (foto.startsWith("data:image") ? foto : `data:image/png;base64,${foto}`) : null;

function EditarPerfil() {
  const navigate = useNavigate();
  const inputFoto = useRef(null);

  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  const usuarioId = usuarioGuardado?.id;

  const [formData, setFormData] = useState(vacio);
  const [original, setOriginal] = useState(vacio); // para saber si hay cambios sin guardar
  const [cargando, setCargando] = useState(!!usuarioId);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }

  useEffect(() => {
    if (!usuarioId) return;

    fetch(`${API}/usuarios/${usuarioId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error de servidor");
        return res.json();
      })
      .then((data) => {
        const cargado = {
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          foto_perfil: data.foto_perfil || ""
        };
        setFormData(cargado);
        setOriginal(cargado);
      })
      .catch((error) => {
        console.error("Error al cargar usuario:", error);
        setAviso({ tipo: "error", texto: "No se pudieron cargar tus datos. Recarga la página e inténtalo de nuevo." });
      })
      .finally(() => setCargando(false));
  }, [usuarioId]);

  // El aviso desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  const hayCambios = JSON.stringify(formData) !== JSON.stringify(original);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoto = (e) => {
    const archivo = e.target.files[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setAviso({ tipo: "error", texto: "El archivo debe ser una imagen (JPG, PNG, etc.)." });
      return;
    }
    if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
      setAviso({ tipo: "error", texto: `La imagen pesa demasiado. El máximo es de ${MAX_FOTO_MB} MB.` });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, foto_perfil: reader.result.split(",")[1] }));
    };
    reader.readAsDataURL(archivo);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuarioId) return;

    setGuardando(true);
    fetch(`${API}/usuarios/${usuarioId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(formData)
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setAviso({ tipo: "error", texto: data.mensaje || "No se pudo actualizar el perfil." });
          return;
        }

        // Solo se actualiza la sesión local si el servidor aceptó los cambios
        const usuarioActualizado = { ...usuarioGuardado, ...formData };
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        // Avisa al panel para que refresque la foto y el nombre de la barra lateral al instante
        window.dispatchEvent(new Event("storage"));

        setOriginal(formData);
        setAviso({ tipo: "ok", texto: data.mensaje || "Perfil actualizado correctamente." });
      })
      .catch(() => setAviso({ tipo: "error", texto: "Error al actualizar el perfil. Revisa tu conexión." }))
      .finally(() => setGuardando(false));
  };

  /* ---------- Sin sesión ---------- */
  if (!usuarioId) {
    return (
      <div className="editar-perfil">
        <div className="ep-estado">
          <p>No se encontró el usuario en sesión.</p>
          <Link to="/login" className="ep-btn ep-btn--primario">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const foto = srcFoto(formData.foto_perfil);
  const inicial = (formData.nombre || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="editar-perfil">
      <button type="button" className="ep-volver" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Volver
      </button>

      <div className="ep-tarjeta">
        <header className="ep-header">
          <h2>Editar perfil</h2>
          <p>Actualiza tu información personal y tu foto.</p>
        </header>

        {aviso && (
          <div className={`ep-aviso ${aviso.tipo}`} role="status">
            {aviso.texto}
          </div>
        )}

        {cargando ? (
          <div className="ep-estado">
            <div className="ep-spinner" aria-hidden="true" />
            <p>Cargando tus datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Foto */}
            <div className="ep-foto">
              {foto ? (
                <img src={foto} alt="Vista previa de tu foto de perfil" className="ep-avatar" />
              ) : (
                <div className="ep-avatar ep-avatar--inicial" aria-hidden="true">
                  {inicial}
                </div>
              )}
              <div className="ep-foto-texto">
                <button type="button" className="ep-btn ep-btn--suave" onClick={() => inputFoto.current?.click()}>
                  <FaCamera /> {foto ? "Cambiar foto" : "Subir foto"}
                </button>
                <small>JPG o PNG, máximo {MAX_FOTO_MB} MB.</small>
              </div>
              <input ref={inputFoto} type="file" accept="image/*" onChange={handleFoto} hidden />
            </div>

            <label className="ep-campo">
              <span>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </label>

            <label className="ep-campo">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>

            <label className="ep-campo">
              <span>Teléfono</span>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="tel"
              />
            </label>

            <div className="ep-acciones">
              <button type="button" className="ep-btn ep-btn--ghost" onClick={() => navigate(-1)} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="ep-btn ep-btn--primario" disabled={!hayCambios || guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditarPerfil;