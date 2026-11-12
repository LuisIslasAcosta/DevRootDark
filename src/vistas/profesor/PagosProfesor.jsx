import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import EstadoInscripcion from "../../componentes/EstadoInscripcion";
import {
  obtenerPagosProfesor, validarPago, abrirComprobante, formatoMoneda, formatoFecha, mensajeError
} from "../../componentes/pagos";
import "../styles/ProfesorPanel.css";
import "../styles/SeccionesProfesor.css";
import "../../componentes/pagos.css";

const FILTROS = [
  { valor: "en_revision", texto: "Por validar" },
  { valor: "pendiente_pago", texto: "Sin comprobante" },
  { valor: "rechazada", texto: "Rechazados" },
  { valor: "aceptada", texto: "Aceptados" },
  { valor: "", texto: "Todos" },
];

// El profesor revisa los comprobantes, comprueba la referencia en su cuenta y acepta o rechaza al alumno
function PagosProfesor() {
  const [filtro, setFiltro] = useState("en_revision");
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const res = await obtenerPagosProfesor(filtro);
      setPagos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMensaje({ tipo: "danger", texto: mensajeError(err, "No se pudieron cargar los pagos") });
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const aceptar = async (pago) => {
    try {
      const res = await validarPago(pago.id, "aceptar");
      setMensaje({ tipo: "success", texto: `${pago.alumno_nombre}: ${res.data.mensaje}` });
      cargar();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: mensajeError(err, "No se pudo validar el pago") });
    }
  };

  const confirmarRechazo = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    try {
      await validarPago(rechazando.id, "rechazar", motivo.trim());
      setMensaje({ tipo: "warning", texto: `Pago de ${rechazando.alumno_nombre} rechazado. El alumno verá el motivo.` });
      setRechazando(null);
      setMotivo("");
      cargar();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: mensajeError(err, "No se pudo rechazar el pago") });
    }
  };

  const verComprobante = async (pago) => {
    try {
      await abrirComprobante(pago.id);
    } catch (err) {
      setMensaje({ tipo: "danger", texto: mensajeError(err, "No se pudo abrir el comprobante") });
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const visibles = texto
    ? pagos.filter((p) =>
        [p.referencia_pago, p.alumno_nombre, p.alumno_email, p.curso_nombre]
          .some((v) => (v || "").toLowerCase().includes(texto)))
    : pagos;

  return (
    <div className="seccion-profesor">
      <h2>Pagos e inscripciones</h2>
      <p>
        Busca el <strong>ID de pago</strong> en el concepto de las transferencias de tu cuenta. Si el pago
        llegó, acepta al alumno; si no, recházalo indicando el motivo.
      </p>

      <div className="pagos-filtros">
        {FILTROS.map((f) => (
          <button key={f.valor} type="button" className={filtro === f.valor ? "activo" : ""}
            onClick={() => setFiltro(f.valor)}>
            {f.texto}
          </button>
        ))}
        <Form.Control style={{ maxWidth: 280 }} size="sm" placeholder="Buscar ID de pago, alumno o curso"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>
      )}

      {cargando ? (
        <p>Cargando pagos...</p>
      ) : visibles.length === 0 ? (
        <p>No hay pagos en esta sección.</p>
      ) : (
        <div className="pagos-lista">
          {visibles.map((p) => (
            <div key={p.id} className="pago-card">
              <div className="pago-card-top">
                <code>{p.referencia_pago || "Sin ID"}</code>
                <EstadoInscripcion estado={p.estado} />
              </div>
              <dl>
                <dt>Alumno</dt><dd>{p.alumno_nombre}{p.alumno_matricula ? ` (${p.alumno_matricula})` : ""}</dd>
                <dt>Correo</dt><dd>{p.alumno_email || "—"}</dd>
                <dt>Curso</dt><dd>{p.curso_nombre}</dd>
                <dt>Monto</dt><dd>{formatoMoneda(p.monto)}</dd>
                <dt>Inscripción</dt><dd>{formatoFecha(p.fecha_inscripcion)}</dd>
                <dt>Comprobante</dt><dd>{p.tiene_comprobante ? formatoFecha(p.fecha_comprobante) : "Aún no lo sube"}</dd>
                {p.datos_pago_alumno?.fecha_pago && (<><dt>Fecha de pago</dt><dd>{p.datos_pago_alumno.fecha_pago}</dd></>)}
                {p.datos_pago_alumno?.monto_pagado && (<><dt>Monto declarado</dt><dd>{formatoMoneda(p.datos_pago_alumno.monto_pagado)}</dd></>)}
                {p.datos_pago_alumno?.nota && (<><dt>Nota</dt><dd>{p.datos_pago_alumno.nota}</dd></>)}
                {p.estado === "rechazada" && (<><dt>Motivo</dt><dd>{p.motivo_rechazo}</dd></>)}
                {p.estado === "aceptada" && p.fecha_validacion && (<><dt>Aceptado</dt><dd>{formatoFecha(p.fecha_validacion)}</dd></>)}
              </dl>

              <div className="pago-card-acciones">
                {p.tiene_comprobante && (
                  <Button size="sm" variant="outline-primary" onClick={() => verComprobante(p)}>Ver comprobante</Button>
                )}
                {p.estado !== "aceptada" && (
                  <Button size="sm" variant="success" onClick={() => aceptar(p)}>Aceptar alumno</Button>
                )}
                {["en_revision", "pendiente_pago"].includes(p.estado) && (
                  <Button size="sm" variant="outline-danger" onClick={() => { setRechazando(p); setMotivo(""); }}>Rechazar</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={!!rechazando} onHide={() => setRechazando(null)} centered>
        <Form onSubmit={confirmarRechazo}>
          <Modal.Header closeButton>
            <Modal.Title>Rechazar pago {rechazando?.referencia_pago}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Label>Motivo (el alumno lo verá)</Form.Label>
            <Form.Control as="textarea" rows={3} required value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. No encontré una transferencia con este ID de pago" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setRechazando(null)}>Cancelar</Button>
            <Button type="submit" variant="danger" disabled={!motivo.trim()}>Rechazar pago</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default PagosProfesor;
