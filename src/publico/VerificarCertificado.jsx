import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSearch, FaShieldAlt } from "react-icons/fa";
import { API_URL } from "../config";
import CertificadoHoja from "../componentes/CertificadoHoja";
import "../vistas/styles/Cursos.css";

const fechaLarga = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "";

/** Página pública para comprobar si un certificado es auténtico. */
function VerificarCertificado() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const [texto, setTexto] = useState(folio || "");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(Boolean(folio));

  useEffect(() => {
    if (!folio) return undefined;
    let activo = true;
    axios
      .get(`${API_URL}/certificados/verificar/${encodeURIComponent(folio)}`)
      .then((res) => activo && setResultado(res.data))
      .catch(() => activo && setResultado({ valido: false, folio, mensaje: "No se pudo verificar en este momento. Intenta más tarde." }))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [folio]);

  const buscar = (e) => {
    e.preventDefault();
    const limpio = texto.trim().toUpperCase();
    if (!limpio) return;
    setCargando(true);
    setResultado(null);
    navigate(`/verificar/${limpio}`);
  };

  return (
    <div className="verif">
      <div className="certp">
        <div className="certp-cabecera">
          <div>
            <h2><FaShieldAlt /> Verificación de certificados</h2>
            <p>Comprueba que un certificado de DevRootDark es auténtico con su folio.</p>
          </div>
          <Link to="/" className="cv-btn cv-btn-suave">Ir a DevRootDark</Link>
        </div>

        <form className="verif-form" onSubmit={buscar}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="DRD-2026-XXXX-XXXX"
            aria-label="Folio del certificado"
          />
          <button type="submit" className="cv-btn"><FaSearch /> Verificar</button>
        </form>

        {cargando && <div className="cv-cargando"><span /> Verificando...</div>}

        {!cargando && resultado && resultado.valido && (
          <>
            <div className="verif-resultado verif-ok">
              <FaCheckCircle />
              <div>
                <h3>Certificado auténtico</h3>
                <p>
                  Emitido a <b>{resultado.alumno}</b> por terminar <b>{resultado.curso}</b> el {fechaLarga(resultado.fecha_emision)}.
                </p>
              </div>
            </div>
            <CertificadoHoja certificado={resultado} />
          </>
        )}

        {!cargando && resultado && !resultado.valido && (
          <div className="verif-resultado verif-mal">
            <FaTimesCircle />
            <div>
              <h3>Certificado no válido</h3>
              <p>{resultado.mensaje || "No encontramos este folio."} Folio consultado: <b>{resultado.folio}</b></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificarCertificado;
