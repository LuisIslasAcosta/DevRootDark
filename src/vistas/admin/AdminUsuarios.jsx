import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import "../styles/AdminVistas.css";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({ rol: "", password: "" });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("Error al cargar usuarios:", err));
  }, []);

  const eliminarUsuario = (id) => {
    fetch(`http://127.0.0.1:5000/api/usuarios/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        alert("Usuario eliminado");
        setUsuarios((prev) => prev.filter((u) => u._id !== id));
      })
      .catch((err) => console.error("Error al eliminar usuario:", err));
  };

  const abrirFormulario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({ rol: usuario.rol, password: "" });
    setShowModal(true);
  };

  const actualizarUsuario = () => {
    fetch(`http://127.0.0.1:5000/api/usuarios/${usuarioSeleccionado._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Usuario actualizado");
        setShowModal(false);
      })
      .catch((err) => console.error("Error al actualizar usuario:", err));
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Usuarios</h2>
      <Table striped bordered hover className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario._id}>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.rol}</td>
              <td>
                <Button
                  variant="success"
                  onClick={() => abrirFormulario(usuario)}
                >
                  Editar
                </Button>{" "}
                <Button
                  variant="danger"
                  onClick={() => eliminarUsuario(usuario._id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal para edición */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={formData.rol}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
              >
                <option value="usuario">Usuario</option>
                <option value="administrador">Administrador</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={actualizarUsuario}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminUsuarios;