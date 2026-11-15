import React, { useCallback, useEffect, useRef, useState } from "react";
import "./FirmaPad.css";
import { recortar } from "./firmaUtil";

/**
 * Lienzo para dibujar la firma con el mouse, el dedo o una pluma.
 * También acepta una foto de la firma en papel: se le quita el fondo blanco.
 * Entrega un PNG transparente con trazo oscuro (el certificado lo pinta en blanco).
 */
const ANCHO = 900;
const ALTO = 300;
const TINTA = "#111111";

function FirmaPad({ onCambio, conImagen = true }) {
  const lienzo = useRef(null);
  const trazando = useRef(false);
  const puntos = useRef([]);
  const [vacio, setVacio] = useState(true);

  const contexto = () => lienzo.current.getContext("2d");

  const limpiar = useCallback(() => {
    contexto().clearRect(0, 0, ANCHO, ALTO);
    setVacio(true);
    onCambio?.(null);
  }, [onCambio]);

  useEffect(() => {
    const ctx = contexto();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = TINTA;
    ctx.fillStyle = TINTA;
  }, []);

  const exportar = useCallback(() => {
    const recorte = recortar(lienzo.current);
    onCambio?.(recorte ? recorte.toDataURL("image/png") : null);
  }, [onCambio]);

  const posicion = (e) => {
    const r = lienzo.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * ANCHO,
      y: ((e.clientY - r.top) / r.height) * ALTO,
      // Con pluma se usa la presión; con mouse o dedo, un grosor fijo
      p: e.pointerType === "pen" && e.pressure ? e.pressure : 0.5,
    };
  };

  const empezar = (e) => {
    e.preventDefault();
    lienzo.current.setPointerCapture(e.pointerId);
    trazando.current = true;
    const pt = posicion(e);
    puntos.current = [pt];
    const ctx = contexto();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.6 + pt.p * 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const mover = (e) => {
    if (!trazando.current) return;
    e.preventDefault();
    const pt = posicion(e);
    const lista = puntos.current;
    lista.push(pt);
    if (lista.length < 3) return;
    // Curvas suaves entre puntos medios para que el trazo no se vea "picado"
    const [a, b, c] = lista.slice(-3);
    const m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const m2 = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const velocidad = Math.hypot(c.x - b.x, c.y - b.y);
    const ctx = contexto();
    ctx.lineWidth = Math.max(1.6, Math.min(6, 2 + c.p * 5 - velocidad * 0.06));
    ctx.beginPath();
    ctx.moveTo(m1.x, m1.y);
    ctx.quadraticCurveTo(b.x, b.y, m2.x, m2.y);
    ctx.stroke();
  };

  const terminar = () => {
    if (!trazando.current) return;
    trazando.current = false;
    setVacio(false);
    exportar();
  };

  // Foto o imagen de la firma: se quita el fondo claro y se deja el trazo oscuro
  const subirImagen = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(ANCHO / img.width, ALTO / img.height, 1);
      const w = Math.round(img.width * escala);
      const h = Math.round(img.height * escala);
      const temp = document.createElement("canvas");
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d");
      tctx.drawImage(img, 0, 0, w, h);
      const datos = tctx.getImageData(0, 0, w, h);
      const d = datos.data;
      for (let i = 0; i < d.length; i += 4) {
        const luz = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Lo claro (papel) se vuelve transparente; lo oscuro (tinta) queda negro
        const opacidad = d[i + 3] === 0 ? 0 : Math.max(0, Math.min(255, (190 - luz) * 3));
        d[i] = 17; d[i + 1] = 17; d[i + 2] = 17; d[i + 3] = opacidad;
      }
      tctx.putImageData(datos, 0, 0);
      const ctx = contexto();
      ctx.clearRect(0, 0, ANCHO, ALTO);
      ctx.drawImage(temp, (ANCHO - w) / 2, (ALTO - h) / 2);
      URL.revokeObjectURL(url);
      setVacio(false);
      exportar();
    };
    img.src = url;
  };

  return (
    <div className="firma-pad">
      <div className="firma-pad-lienzo">
        <canvas
          ref={lienzo}
          width={ANCHO}
          height={ALTO}
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
          aria-label="Área para dibujar tu firma"
        />
        {vacio && <span className="firma-pad-guia">Firma aquí</span>}
        <span className="firma-pad-linea" aria-hidden="true" />
      </div>
      <div className="firma-pad-acciones">
        <button type="button" className="firma-pad-btn" onClick={limpiar}>Borrar</button>
        {conImagen && (
          <label className="firma-pad-btn firma-pad-btn-principal">
            Elegir imagen de mi firma
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={subirImagen} />
          </label>
        )}
      </div>
    </div>
  );
}

export default FirmaPad;
