import { useEffect, useRef, useState } from "react";
import "./Logo.css";

// Capas del logo: "color" (personaje, ROOT, DARK) y "mono" (DEV y el lema),
// la capa mono se pinta con el color de texto del tema activo.
const CAPAS = {
  banner: { color: "/brand/logo-banner-color.png", mono: "/brand/logo-banner-mono.png" },
  nombre: { color: "/brand/logo-wordmark-color.png", mono: "/brand/logo-wordmark-mono.png" },
};
const ICONO = "/brand/logo-icon.png";

const leerColor = (texto) => {
  const v = texto.match(/[\d.]+/g)?.map(Number);
  return v && v.length >= 3 ? { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 } : null;
};
const luminancia = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// El logo sigue el color de texto de su contenedor (el que el diseño ya hace legible):
// si el texto es claro, el fondo es oscuro (brillo neón); si es oscuro, el fondo es claro.
function analizarFondo(elemento) {
  const colorTexto = getComputedStyle(elemento).color;
  const texto = leerColor(colorTexto);
  if (!texto) {
    const oscuro = document.documentElement.getAttribute("data-theme") === "dark";
    return { oscuro, colorTexto: oscuro ? "#f4f4f9" : "#1d2333" };
  }
  return { oscuro: luminancia(texto) > 0.5, colorTexto };
}

/**
 * Logo de DevRootDark que se adapta al tema.
 *  - variante="banner": personaje + nombre + lema (página principal, login)
 *  - variante="nav":    personaje + nombre (barras de navegación)
 *  - variante="icono":  solo el personaje
 */
function Logo({ variante = "banner", alto, className = "" }) {
  const ref = useRef(null);
  const [{ oscuro, colorTexto }, setFondo] = useState({ oscuro: false, colorTexto: undefined });

  useEffect(() => {
    let frame;
    const actualizar = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (ref.current) setFondo(analizarFondo(ref.current));
      });
    };
    actualizar();

    // Cambios de tema (data-theme) o de colores personalizados (style en <html>)
    const observador = new MutationObserver(actualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
    window.addEventListener("storage", actualizar);
    return () => {
      cancelAnimationFrame(frame);
      observador.disconnect();
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  const clases = `drd-logo drd-logo--${variante} ${oscuro ? "drd-logo--oscuro" : "drd-logo--claro"} ${className}`;
  const estilo = { ...(alto ? { height: alto } : {}), ...(colorTexto ? { "--logo-texto": colorTexto } : {}) };

  const capas = (tipo) => (
    <span className="drd-logo__capas">
      <img src={CAPAS[tipo].color} alt="DevRootDark" className="drd-logo__color" draggable="false" />
      <span
        className="drd-logo__mono"
        aria-hidden="true"
        style={{ WebkitMaskImage: `url(${CAPAS[tipo].mono})`, maskImage: `url(${CAPAS[tipo].mono})` }}
      />
    </span>
  );

  if (variante === "icono") {
    return (
      <span ref={ref} className={clases} style={estilo}>
        <img src={ICONO} alt="DevRootDark" className="drd-logo__icono" draggable="false" />
      </span>
    );
  }

  if (variante === "nav") {
    return (
      <span ref={ref} className={clases} style={estilo}>
        <img src={ICONO} alt="" aria-hidden="true" className="drd-logo__icono" draggable="false" />
        {capas("nombre")}
      </span>
    );
  }

  return (
    <span ref={ref} className={clases} style={estilo}>
      {capas("banner")}
    </span>
  );
}

export default Logo;
