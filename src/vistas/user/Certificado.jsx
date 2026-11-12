import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaAward,
  FaBookOpen,
  FaDownload,
  FaLink,
  FaLock,
  FaShieldAlt,
  FaTrophy
} from "react-icons/fa";
import { API_URL } from "../../config";
import CertificadoHoja from "../../componentes/CertificadoHoja";
import { urlVerificacion } from "../../componentes/cursoVisual";
import "../styles/Cursos.css";

const encabezados = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Certificado() {
  const { cursoId } = useParams();
  const [estado, setEstado] = useState(null);
  const [certificado, setCertificado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let activo = true;
    axios
      .get(`${API_URL}/certificados/curso/${cursoId}`, { headers: encabezados() })
      .then((res) => {
        if (!activo) return;
        setEstado(res.data);
        if (res.data?.certificado) setCertificado(res.data.certificado);
      })
      .catch((err) => activo && setError(err?.response?.data?.mensaje || "No se pudo consultar tu certificado."))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [cursoId]);

  const generar = async () => {
    setGenerando(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/certificados/curso/${cursoId}`, {}, { headers: encabezados() });
      setCertificado(res.data);
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo generar el certificado.");
    } finally {
      setGenerando(false);
    }
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlVerificacion(certificado.folio));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copia el enlace de verificación:", urlVerificacion(certificado.folio));
    }
  };

  if (cargando) return <div className="cv-cargando"><span /> Cargando tu certificado...</div>;

  return (
    <div className="certp">
      <div className="certp-cabecera">
        <div>
          <Link to={`/principal/cursos/${cursoId}`} className="cv-btn cv-btn-suave cv-btn-chico"><FaArrowLeft /> Volver al curso</Link>
          <h2 style={{ marginTop: "0.75rem" }}><FaAward /> Tu certificado</h2>
          {certificado && <p>{certificado.curso}</p>}
        </div>
        {certificado && (
          <div className="certp-acciones">
            <button type="button" className="cv-btn" onClick={() => window.print()}>
              <FaDownload /> Descargar PDF
            </button>
            <button type="button" className="cv-btn cv-btn-suave" onClick={copiarEnlace}>
              <FaLink /> Copiar enlace de verificación
            </button>
            {copiado && <span className="certp-copiado">¡Enlace copiado!</span>}
          </div>
        )}
      </div>

      {error && !certificado && !estado && (
        <div className="certp-tarjeta"><FaLock className="certp-icono-gris" /><p>{error}</p></div>
      )}

      {/* ---------- Ya tiene certificado ---------- */}
      {certificado && (
        <>
          <div className="certp-felicidades">
            <FaTrophy />
            <div>
              <strong>¡Felicidades, terminaste el curso!</strong>
              <p>
                Para guardarlo, usa <b>Descargar PDF</b> y elige «Guardar como PDF». Cualquier escuela o empresa puede
                comprobar que es auténtico con el folio <b>{certificado.folio}</b>.
              </p>
            </div>
          </div>
          <CertificadoHoja certificado={certificado} />
        </>
      )}

      {/* ---------- Puede generarlo ---------- */}
      {!certificado && estado?.disponible && (
        <div className="certp-tarjeta">
          <FaAward className="certp-icono-oro" />
          <h3>¡Ya puedes obtener tu certificado!</h3>
          <p>
            Terminaste todas las lecciones y exámenes con un promedio de <b>{estado.promedio}%</b>. Tu certificado tendrá
            un folio único para que cualquiera pueda verificarlo.
          </p>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <button type="button" className="cv-btn" onClick={generar} disabled={generando}>
            <FaAward /> {generando ? "Generando..." : "Generar mi certificado"}
          </button>
        </div>
      )}

      {/* ---------- Todavía no ---------- */}
      {!certificado && estado && !estado.disponible && (
        <div className="certp-tarjeta">
          <FaLock className="certp-icono-gris" />
          <h3>Aún no puedes obtener el certificado</h3>
          {!estado.terminado ? (
            <>
              <p>Termina todo el curso para desbloquearlo. Te falta:</p>
              <ul className="certp-pendientes">
                {estado.faltan_lecciones > 0 && <li>{estado.faltan_lecciones} {estado.faltan_lecciones === 1 ? "lección" : "lecciones"}</li>}
                {estado.faltan_examenes > 0 && <li>{estado.faltan_examenes} {estado.faltan_examenes === 1 ? "examen" : "exámenes"}</li>}
              </ul>
            </>
          ) : (
            <>
              <p>
                Ya terminaste el curso, pero tu promedio es <b>{estado.promedio}%</b> y necesitas{" "}
                <b>{estado.calificacion_aprobatoria}%</b> o más.
              </p>
              {estado.examenes_reprobados?.length > 0 && (
                <ul className="certp-pendientes">
                  {estado.examenes_reprobados.map((t) => <li key={t}>Repite: {t}</li>)}
                </ul>
              )}
            </>
          )}
          <Link to={`/principal/cursos/${cursoId}`} className="cv-btn"><FaBookOpen /> Continuar el curso</Link>
        </div>
      )}

      {certificado && (
        <p className="cv-suave" style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
          <FaShieldAlt /> Enlace de verificación: {urlVerificacion(certificado.folio)}
        </p>
      )}
    </div>
  );
}

export default Certificado;
