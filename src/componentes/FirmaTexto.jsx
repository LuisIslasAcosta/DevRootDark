import React, { useEffect, useState } from "react";
import { recortar } from "./firmaUtil";
import "./FirmaPad.css";
// Fuentes incluidas en la app: funcionan sin internet y sin instalar nada
import "@fontsource/great-vibes/latin-400.css";
import "@fontsource/allura/latin-400.css";
import "@fontsource/dancing-script/latin-600.css";
import "@fontsource/sacramento/latin-400.css";

// Estilos de firma escrita (como "Escribir firma" al firmar un PDF)
const ESTILOS = [
  { id: "great", nombre: "Elegante", familia: "Great Vibes", tamano: 120 },
  { id: "allura", nombre: "Clásica", familia: "Allura", tamano: 120 },
  { id: "dancing", nombre: "Moderna", familia: "Dancing Script", tamano: 100, peso: 600 },
  { id: "sacramento", nombre: "Ligera", familia: "Sacramento", tamano: 120 },
];
const RESPALDO = '"Segoe Script", "Lucida Handwriting", "Brush Script MT", cursive';
// Espera a que el navegador tenga listas las fuentes antes de dibujar la firma
function cargarFuentes() {
  return Promise.all(ESTILOS.map((e) => document.fonts.load(`${e.peso || 400} ${e.tamano}px "${e.familia}"`).catch(() => null)));
}

function dibujar(texto, estilo) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "middle";
  let tamano = estilo.tamano;
  ctx.font = `${estilo.peso || 400} ${tamano}px "${estilo.familia}", ${RESPALDO}`;
  // Si el nombre es largo se reduce para que quepa
  while (ctx.measureText(texto).width > canvas.width - 80 && tamano > 40) {
    tamano -= 6;
    ctx.font = `${estilo.peso || 400} ${tamano}px "${estilo.familia}", ${RESPALDO}`;
  }
  ctx.fillText(texto, 40, canvas.height / 2);
  const recorte = recortar(canvas);
  return recorte ? recorte.toDataURL("image/png") : null;
}

/** Firma escrita: el profesor escribe su nombre y elige un estilo. */
function FirmaTexto({ nombreInicial = "", onCambio }) {
  const [texto, setTexto] = useState(nombreInicial);
  const [estilo, setEstilo] = useState(ESTILOS[0].id);
  const [listas, setListas] = useState(false);

  useEffect(() => {
    cargarFuentes().finally(() => setListas(true));
  }, []);

  useEffect(() => {
    if (!listas) return;
    const limpio = texto.trim();
    onCambio?.(limpio ? dibujar(limpio, ESTILOS.find((e) => e.id === estilo)) : null);
  }, [texto, estilo, listas, onCambio]);

  return (
    <div className="firma-texto">
      <label className="firma-texto-campo">
        Tu nombre como lo quieres firmar
        <input value={texto} maxLength={60} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Rafael Gutiérrez" />
      </label>
      <div className="firma-texto-estilos" role="radiogroup" aria-label="Estilo de firma">
        {ESTILOS.map((e) => (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={estilo === e.id}
            className={`firma-texto-estilo${estilo === e.id ? " activo" : ""}`}
            onClick={() => setEstilo(e.id)}
          >
            <span style={{ fontFamily: `"${e.familia}", ${RESPALDO}`, fontWeight: e.peso || 400 }}>{texto.trim() || "Tu firma"}</span>
            <small>{e.nombre}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FirmaTexto;
