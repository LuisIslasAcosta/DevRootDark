import React from "react";
import Logo from "./Logo";
import { urlVerificacion } from "./cursoVisual";
import "./Certificado.css";

const fechaLarga = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "";


/**
 * Hoja del certificado (tamaño carta/A4 horizontal). Se usa en la página del
 * alumno y en la verificación pública; al imprimir solo sale esta hoja.
 */
function CertificadoHoja({ certificado }) {
  const c = certificado;
  return (
    <div className="cert-escala">
      <article className="cert-hoja" aria-label={`Certificado de ${c.alumno}`}>
        <div className="cert-marco">
          <span className="cert-esquina cert-esquina-1" aria-hidden="true" />
          <span className="cert-esquina cert-esquina-2" aria-hidden="true" />
          <span className="cert-esquina cert-esquina-3" aria-hidden="true" />
          <span className="cert-esquina cert-esquina-4" aria-hidden="true" />

          <header className="cert-cabecera">
            <Logo variante="nav" alto="2.6em" className="cert-logo" />
            <span className="cert-plataforma">Plataforma educativa de programación</span>
          </header>

          <div className="cert-titulo">
            <span>Certificado</span>
            <small>de término de curso</small>
          </div>

          <p className="cert-otorga">Se otorga el presente reconocimiento a</p>
          <h2 className="cert-nombre">{c.alumno}</h2>
          <p className="cert-texto">por haber concluido satisfactoriamente el curso</p>
          <h3 className="cert-curso">{c.curso}</h3>

          <ul className="cert-datos">
            <li><strong>{c.promedio !== null && c.promedio !== undefined ? `${Math.round(c.promedio)}%` : "—"}</strong><span>Promedio final</span></li>
            <li><strong>{c.lecciones}</strong><span>{c.lecciones === 1 ? "Lección" : "Lecciones"}</span></li>
            <li><strong>{c.examenes}</strong><span>{c.examenes === 1 ? "Examen aprobado" : "Exámenes"}</span></li>
          </ul>

          <p className="cert-acredita">
            Acreditó todas las lecciones y evaluaciones del programa con un promedio aprobatorio,
            demostrando dedicación y dominio de los temas del curso.
          </p>

          <footer className="cert-pie">
            <div className="cert-firma">
              <span className="cert-firma-nombre">{c.profesor || "Profesor del curso"}</span>
              <span className="cert-firma-linea" />
              <span className="cert-firma-cargo">Profesor del curso</span>
            </div>

            <div className="cert-sello" aria-hidden="true">
              <div>
                <span>DevRoot</span>
                <strong>Dark</strong>
                <span>Certificado</span>
              </div>
            </div>

            <div className="cert-firma">
              <span className="cert-firma-nombre">{fechaLarga(c.fecha_emision)}</span>
              <span className="cert-firma-linea" />
              <span className="cert-firma-cargo">Fecha de emisión</span>
            </div>
          </footer>

          <div className="cert-folio">
            Folio <b>{c.folio}</b> · Verifica su autenticidad en {urlVerificacion(c.folio).replace(/^https?:\/\//, "")}
          </div>
        </div>
      </article>
    </div>
  );
}

export default CertificadoHoja;
