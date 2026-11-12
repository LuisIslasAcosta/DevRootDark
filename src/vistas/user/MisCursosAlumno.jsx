import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/EstilosAlumno.css";
import { API_URL } from "../../config";
import EstadoInscripcion from "../../componentes/EstadoInscripcion";
import PagoInscripcionModal from "../../componentes/PagoInscripcionModal";
import { obtenerMisInscripciones, formatoMoneda, authHeader } from "../../componentes/pagos";
import "../../componentes/pagos.css";

function MisCursosAlumno() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]); // { curso, inscripcion }
  const [loading, setLoading] = useState(true);
  const [pagoAbierto, setPagoAbierto] = useState(null);

  // ================= CARGAR CURSOS E INSCRIPCIONES =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [cursosRes, insRes] = await Promise.all([
          axios.get(`${API_URL}/cursos`, { headers: authHeader() }),
          obtenerMisInscripciones(),
        ]);

        const cursos = Array.isArray(cursosRes.data) ? cursosRes.data : [];
        const lista = (Array.isArray(insRes.data) ? insRes.data : []).map((ins) => ({
          inscripcion: ins,
          curso: cursos.find((c) => c.id === ins.curso_id) || { id: ins.curso_id, nombre: ins.curso_nombre },
        }));
        setItems(lista);
      } catch (error) {
        console.error("Error cargando cursos:", error);
        if (error.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const actualizarInscripcion = (nueva) => {
    setItems((prev) => prev.map((it) => (it.inscripcion.id === nueva.id ? { ...it, inscripcion: nueva } : it)));
    setPagoAbierto(nueva);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="dashboard-topbar">
        <h2>Mis Cursos</h2>
        <p>Consulta el estado de tus inscripciones y entra a los cursos que ya fueron aceptados.</p>
      </div>

      {/* LISTADO */}
      <div className="file-grid">
        {loading ? (
          <p>Cargando tus cursos...</p>
        ) : items.length === 0 ? (
          <p>No estás inscrito en ningún curso aún.</p>
        ) : (
          items.map(({ curso, inscripcion }) => (
            <div key={inscripcion.id} className="curso-form-card">
              {curso.imagenes?.length > 0 && (
                <img src={`${API_URL}/uploads/imagenes/${curso.imagenes[0]}`} alt={curso.nombre} className="curso-thumb" />
              )}

              <h3 className="curso-title">{curso.nombre}</h3>
              {curso.descripcion && <p>{curso.descripcion}</p>}
              {curso.profesor && <span>Profesor: {curso.profesor}</span>}

              <div className="insc-info">
                <EstadoInscripcion estado={inscripcion.estado} />
                {inscripcion.monto > 0 && <span>Monto: {formatoMoneda(inscripcion.monto)}</span>}
                {inscripcion.referencia_pago && (
                  <span>ID de pago: <code>{inscripcion.referencia_pago}</code></span>
                )}
                {inscripcion.estado === "rechazada" && inscripcion.motivo_rechazo && (
                  <span className="insc-motivo">Motivo: {inscripcion.motivo_rechazo}</span>
                )}
              </div>

              {inscripcion.estado === "aceptada" ? (
                <Link to={`/principal/cursos/${curso.id}`} className="btn-modern" style={{ marginTop: "10px" }}>
                  Ver Curso
                </Link>
              ) : (
                <button className="btn-modern" onClick={() => setPagoAbierto(inscripcion)}>
                  {inscripcion.estado === "en_revision" ? "Ver detalle del pago"
                    : inscripcion.estado === "rechazada" ? "Subir nuevo comprobante"
                    : "Pagar y subir comprobante"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <PagoInscripcionModal
        show={!!pagoAbierto}
        inscripcion={pagoAbierto}
        onHide={() => setPagoAbierto(null)}
        onActualizada={actualizarInscripcion}
      />
    </div>
  );
}

export default MisCursosAlumno;
