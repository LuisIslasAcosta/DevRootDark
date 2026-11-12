import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import EstadoInscripcion from "./EstadoInscripcion";
import {
  ESTADOS_INSCRIPCION, formatoMoneda, formatoFecha, subirComprobante, abrirComprobante, mensajeError
} from "./pagos";
import "./pagos.css";

// Ventana de pago: muestra el ID único de pago (referencia), las instrucciones del profesor
// y permite al alumno adjuntar su comprobante.
function PagoInscripcionModal({ show, onHide, inscripcion, onActualizada }) {
  const [archivo, setArchivo] = useState(null);
  const [fechaPago, setFechaPago] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  if (!inscripcion) return null;

  const { estado } = inscripcion;
  const puedeSubir = ["pendiente_pago", "rechazada", "en_revision"].includes(estado);

  const copiarReferencia = async () => {
    try {
      await navigator.clipboard.writeText(inscripcion.referencia_pago);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!archivo) return setError("Adjunta tu comprobante de pago (PDF o imagen).");
    if (archivo.size > 5 * 1024 * 1024) return setError("El comprobante no debe pesar más de 5 MB.");

    try {
      setEnviando(true);
      const res = await subirComprobante(inscripcion.id, {
        comprobante: archivo,
        fecha_pago: fechaPago,
        monto_pagado: montoPagado,
        nota,
      });
      setArchivo(null);
      onActualizada?.(res.data.inscripcion);
    } catch (err) {
      setError(mensajeError(err, "No se pudo enviar el comprobante"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="pago-modal">
      <Modal.Header closeButton>
        <Modal.Title>Pago del curso: {inscripcion.curso_nombre}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="pago-resumen">
          <div>
            <span className="pago-etiqueta">Monto a pagar</span>
            <strong className="pago-monto">{formatoMoneda(inscripcion.monto)}</strong>
          </div>
          <div>
            <span className="pago-etiqueta">Estado</span>
            <EstadoInscripcion estado={estado} />
          </div>
        </div>

        <div className="pago-referencia">
          <span className="pago-etiqueta">Tu ID único de pago</span>
          <div className="pago-referencia-fila">
            <code>{inscripcion.referencia_pago}</code>
            <Button size="sm" variant="outline-secondary" onClick={copiarReferencia}>
              {copiado ? "¡Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="pago-aviso">
            Escribe este ID en el <strong>concepto o referencia de tu pago</strong>. Así tu profesor
            puede identificar tu transferencia o depósito.
          </p>
        </div>

        <div className="pago-instrucciones">
          <span className="pago-etiqueta">Datos para realizar el pago</span>
          <p>
            {inscripcion.instrucciones_pago?.trim()
              ? inscripcion.instrucciones_pago
              : "El profesor aún no ha registrado sus datos de pago. Comunícate con él para conocer la cuenta a la que debes transferir."}
          </p>
        </div>

        {estado === "rechazada" && inscripcion.motivo_rechazo && (
          <Alert variant="danger">
            <strong>Pago rechazado:</strong> {inscripcion.motivo_rechazo}
          </Alert>
        )}

        {estado === "en_revision" && (
          <Alert variant="info">
            Enviaste tu comprobante el {formatoFecha(inscripcion.fecha_comprobante)}. {ESTADOS_INSCRIPCION.en_revision.ayuda}
            {inscripcion.tiene_comprobante && (
              <Button variant="link" size="sm" onClick={() => abrirComprobante(inscripcion.id)}>
                Ver mi comprobante
              </Button>
            )}
          </Alert>
        )}

        {estado === "aceptada" && (
          <Alert variant="success">Tu pago fue validado. ¡Ya tienes acceso al curso!</Alert>
        )}

        {puedeSubir && (
          <Form onSubmit={enviar} className="pago-form">
            <h6>{estado === "en_revision" ? "¿Te equivocaste de archivo? Reemplaza tu comprobante" : "Adjunta tu comprobante de pago"}</h6>

            <Form.Group className="mb-2">
              <Form.Label>Comprobante (PDF, PNG, JPG o WEBP, máximo 5 MB)</Form.Label>
              <Form.Control type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </Form.Group>

            <div className="pago-form-fila">
              <Form.Group className="mb-2">
                <Form.Label>Fecha del pago</Form.Label>
                <Form.Control type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Monto pagado</Form.Label>
                <Form.Control type="number" min="0" step="0.01" placeholder={inscripcion.monto}
                  value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} />
              </Form.Group>
            </div>

            <Form.Group className="mb-2">
              <Form.Label>Nota para el profesor (opcional)</Form.Label>
              <Form.Control as="textarea" rows={2} maxLength={500} value={nota}
                onChange={(e) => setNota(e.target.value)} placeholder="Ej. Transferencia desde BBVA" />
            </Form.Group>

            {error && <Alert variant="danger" className="py-2">{error}</Alert>}

            <Button type="submit" className="btn-modern" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar comprobante"}
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default PagoInscripcionModal;
