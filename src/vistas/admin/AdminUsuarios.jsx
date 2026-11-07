import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import { FaSearch, FaPen, FaTrashAlt, FaUsers } from "react-icons/fa";
import "../styles/AdminVistas.css";

const API = "https://apidevrootdark.onrender.com/api";

const ROLES = [
  { value: "usuario", label: "Usuario" },
  { value: "profesor", label: "Profesor" },
  { value: "administrador", label: "Administrador" }
];

const etiquetaRol = (rol) => ROLES.find((r) => r.value === rol)?.label || rol || "—";

const iniciales = (u) =>
  `${(u.nombre || "").charAt(0)}${(u.apellidop || "").charAt(0)}`.toUpperCase() || "?";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({ rol: "", password: "" });
  const [showModal, setShowModal] = useState(false);

  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }

  useEffect(() => {
    fetch(`${API}/usuarios`)
      .then((res) => {
        if (!res.ok) throw new Error("Error de servidor");
        return res.json();
      })
      .then(setUsuarios)
      .catch((err) => {
        console.error("Error al cargar usuarios:", err);
        setErrorCarga(true);
      })
      .finally(() => setCargando(false));
  }, []);

  // El aviso desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol !== "todos" && u.rol !== filtroRol) return false;
      if (!q) return true;
      return [u.nombre, u.apellidop, u.apellidom, u.email]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q));
    });
  }, [usuarios, busqueda, filtroRol]);

  /* ---------- Eliminar ---------- */
  const confirmarEliminar = () => {
    const { id, nombre } = usuarioAEliminar;
    setGuardando(true);
    fetch(`${API}/usuarios/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar");
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
        setAviso({ tipo: "ok", texto: `Usuario ${nombre} eliminado.` });
      })
      .catch((err) => {
        console.error("Error al eliminar usuario:", err);
        setAviso({ tipo: "error", texto: "No se pudo eliminar el usuario. Inténtalo de nuevo." });
      })
      .finally(() => {
        setGuardando(false);
        setUsuarioAEliminar(null);
      });
  };

  /* ---------- Editar ---------- */
  const abrirFormulario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({ rol: usuario.rol, password: "" });
    setShowModal(true);
  };

  const datosActualizados = () => {
    const datos = {};
    if (formData.rol && formData.rol !== usuarioSeleccionado?.rol) {
      datos.rol = formData.rol;
    }
    if (formData.password && formData.password.trim() !== "") {
      datos.password = formData.password;
    }
    return datos;
  };

  const hayCambios = usuarioSeleccionado && Object.keys(datosActualizados()).length > 0;

  const actualizarUsuario = () => {
    const datos = datosActualizados();
    if (Object.keys(datos).length === 0) return;

    setGuardando(true);
    fetch(`${API}/usuarios/${usuarioSeleccionado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo actualizar");
        // Solo el rol se refleja en la tabla; la contraseña nunca se guarda en el estado
        if (datos.rol) {
          setUsuarios((prev) =>
            prev.map((u) => (u.id === usuarioSeleccionado.id ? { ...u, rol: datos.rol } : u))
          );
        }
        setAviso({ tipo: "ok", texto: "Usuario actualizado." });
        setShowModal(false);
      })
      .catch((err) => {
        console.error("Error al actualizar usuario:", err);
        setAviso({ tipo: "error", texto: "No se pudo actualizar el usuario. Inténtalo de nuevo." });
      })
      .finally(() => setGuardando(false));
  };

  return (
    <div className="admin-section">
      <div className="av-header">
        <div>
          <h2>Gestión de usuarios</h2>
          <p className="av-sub">
            {cargando
              ? "Cargando..."
              : `${usuariosFiltrados.length} de ${usuarios.length} usuarios`}
          </p>
        </div>

        <div className="av-tools">
          <label className="av-buscar">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por nombre o email"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </label>
          <select
            className="av-filtro"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="todos">Todos los roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {aviso && (
        <div className={`av-aviso ${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}

      {errorCarga ? (
        <div className="av-vacio">
          <p>No se pudieron cargar los usuarios. Revisa que el servidor esté activo y recarga la página.</p>
        </div>
      ) : !cargando && usuariosFiltrados.length === 0 ? (
        <div className="av-vacio">
          <FaUsers aria-hidden="true" />
          <p>
            {usuarios.length === 0
              ? "Aún no hay usuarios registrados."
              : "Ningún usuario coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="av-tabla-wrap">
          <table className="admin-table admin-table--stack">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Apellidos</th>
                <th>Email</th>
                <th>Rol</th>
                <th className="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td data-label="Usuario">
                    <div className="av-persona">
                      <span className="av-avatar">{iniciales(usuario)}</span>
                      <span className="av-nombre">{usuario.nombre}</span>
                    </div>
                  </td>
                  <td data-label="Apellidos">
                    {[usuario.apellidop, usuario.apellidom].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td data-label="Email" className="av-email">
                    {usuario.email}
                  </td>
                  <td data-label="Rol">
                    <span className={`av-rol ${usuario.rol}`}>{etiquetaRol(usuario.rol)}</span>
                  </td>
                  <td data-label="Acciones" className="col-acciones">
                    <div className="av-acciones">
                      <button
                        type="button"
                        className="av-btn av-btn--editar"
                        onClick={() => abrirFormulario(usuario)}
                      >
                        <FaPen /> Editar
                      </button>
                      <button
                        type="button"
                        className="av-btn av-btn--eliminar"
                        onClick={() => setUsuarioAEliminar(usuario)}
                      >
                        <FaTrashAlt /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="av-modal">
        <Modal.Header closeButton>
          <Modal.Title>Editar usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioSeleccionado && (
            <div className="av-persona av-persona--modal">
              <span className="av-avatar av-avatar--lg">{iniciales(usuarioSeleccionado)}</span>
              <div>
                <p className="av-nombre">
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidop}{" "}
                  {usuarioSeleccionado.apellidom}
                </p>
                <p className="av-modal-sub">
                  {usuarioSeleccionado.email} · Rol actual:{" "}
                  {etiquetaRol(usuarioSeleccionado.rol)}
                </p>
              </div>
            </div>
          )}
          <Form onSubmit={(e) => e.preventDefault()}>
            <Form.Group>
              <Form.Label>Nuevo rol</Form.Label>
              <Form.Select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Nueva contraseña</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                placeholder="Déjala vacía para conservar la actual"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="av-btn av-btn--ghost" onClick={() => setShowModal(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="av-btn av-btn--primario"
            onClick={actualizarUsuario}
            disabled={!hayCambios || guardando}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal: confirmar eliminación */}
      <Modal
        show={!!usuarioAEliminar}
        onHide={() => !guardando && setUsuarioAEliminar(null)}
        centered
        className="av-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Eliminar usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioAEliminar && (
            <p>
              ¿Seguro que quieres eliminar a{" "}
              <strong>
                {usuarioAEliminar.nombre} {usuarioAEliminar.apellidop}
              </strong>{" "}
              ({usuarioAEliminar.email})? Esta acción no se puede deshacer.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="av-btn av-btn--ghost"
            onClick={() => setUsuarioAEliminar(null)}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="av-btn av-btn--peligro"
            onClick={confirmarEliminar}
            disabled={guardando}
          >
            {guardando ? "Eliminando..." : "Eliminar"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminUsuarios;