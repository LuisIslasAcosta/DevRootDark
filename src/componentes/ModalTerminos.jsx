import { useEffect, useState } from "react";
import { FaFileContract, FaExternalLinkAlt } from "react-icons/fa";
import { TERMINOS, TERMINOS_TITULO } from "../data/terminos";
import "./ModalTerminos.css";

/**
 * Ventana que obliga a aceptar los términos y condiciones.
 *  - actualizacion: true si el usuario ya había aceptado una versión anterior
 *  - onAceptar: se llama al presionar "Aceptar y continuar" (con la casilla marcada)
 *  - onCancelar: cierra sin aceptar (en sesiones abiertas, cierra la sesión)
 */
function ModalTerminos({ version, actualizacion = false, cargando = false, error = "", textoCancelar = "Cancelar", onAceptar, onCancelar }) {
  const [acepto, setAcepto] = useState(false);

  // Bloquea el desplazamiento de la página mientras la ventana está abierta
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, []);

  return (
    <div className="mt-fondo" role="presentation">
      <div className="mt-ventana" role="dialog" aria-modal="true" aria-labelledby="mt-titulo">
        <header className="mt-cabecera">
          <span className="mt-icono" aria-hidden="true"><FaFileContract /></span>
          <div>
            <h2 id="mt-titulo">{actualizacion ? "Actualizamos los términos" : "Términos y condiciones"}</h2>
            <p>
              {actualizacion
                ? "Hicimos cambios en nuestros términos. Léelos y acéptalos para seguir usando DevRootDark."
                : "Para continuar necesitas leer y aceptar nuestros términos y condiciones."}
            </p>
          </div>
        </header>

        <div className="mt-contenido" tabIndex={0}>
          <h3>{TERMINOS_TITULO}</h3>
          {version && <p className="mt-version">Versión vigente: {version}</p>}
          <ol>
            {TERMINOS.map((t) => (
              <li key={t.titulo}><strong>{t.titulo}</strong> {t.texto}</li>
            ))}
          </ol>
          <a href="/politicas" target="_blank" rel="noopener noreferrer" className="mt-enlace">
            Abrir en otra pestaña <FaExternalLinkAlt aria-hidden="true" />
          </a>
        </div>

        <label className="mt-casilla">
          <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
          <span>He leído y acepto los términos, condiciones y políticas de privacidad.</span>
        </label>

        {error && <p className="mt-error" role="alert">{error}</p>}

        <footer className="mt-acciones">
          <button type="button" className="mt-boton mt-boton--secundario" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </button>
          <button type="button" className="mt-boton" onClick={onAceptar} disabled={!acepto || cargando}>
            {cargando ? "Guardando..." : "Aceptar y continuar"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ModalTerminos;
