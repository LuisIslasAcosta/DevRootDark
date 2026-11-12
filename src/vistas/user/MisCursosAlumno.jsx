import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FaArrowRight,
  FaAward,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaGraduationCap,
  FaMoneyBillWave,
  FaPlay,
  FaTrophy,
  FaChalkboardTeacher
} from "react-icons/fa";
import "../styles/EstilosAlumno.css";
import "../styles/Cursos.css";
import { API_URL } from "../../config";
import EstadoInscripcion from "../../componentes/EstadoInscripcion";
import PagoInscripcionModal from "../../componentes/PagoInscripcionModal";
import { obtenerMisInscripciones, formatoMoneda, authHeader } from "../../componentes/pagos";
import { degradadoCurso, portadaCurso, inicialesCurso, colorCalificacion } from "../../componentes/cursoVisual";
import "../../componentes/pagos.css";

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "curso", texto: "En curso" },
  { valor: "terminado", texto: "Terminados" },
  { valor: "pago", texto: "Pagos pendientes" }
];

function MisCursosAlumno() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]); // { curso, inscripcion }
  const [progresos, setProgresos] = useState({}); // curso_id -> progreso
  const [loading, setLoading] = useState(true);
  const [pagoAbierto, setPagoAbierto] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  // ================= CARGAR CURSOS, INSCRIPCIONES Y PROGRESO =================
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
          obtenerMisInscripciones()
        ]);

        const cursos = Array.isArray(cursosRes.data) ? cursosRes.data : [];
        const lista = (Array.isArray(insRes.data) ? insRes.data : []).map((ins) => ({
          inscripcion: ins,
          curso: cursos.find((c) => c.id === ins.curso_id) || { id: ins.curso_id, nombre: ins.curso_nombre }
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

    axios
      .get(`${API_URL}/progreso/alumno`, { headers: authHeader() })
      .then((res) => {
        const mapa = {};
        (res.data?.cursos || []).forEach((c) => {
          mapa[c.curso_id] = c;
        });
        setProgresos(mapa);
      })
      .catch(() => setProgresos({}));
  }, [navigate]);

  const actualizarInscripcion = (nueva) => {
    setItems((prev) => prev.map((it) => (it.inscripcion.id === nueva.id ? { ...it, inscripcion: nueva } : it)));
    setPagoAbierto(nueva);
  };

  const conEstado = useMemo(
    () =>
      items.map((it) => {
        const p = progresos[it.curso.id];
        const aceptada = it.inscripcion.estado === "aceptada";
        let grupo = "pago";
        if (aceptada) grupo = p?.terminado ? "terminado" : "curso";
        return { ...it, progreso: p, grupo };
      }),
    [items, progresos]
  );

  const conteo = (g) => conEstado.filter((c) => g === "todos" || c.grupo === g).length;
  const visibles = conEstado.filter((c) => filtro === "todos" || c.grupo === filtro);

  return (
    <div className="mc">
      {/* ================= ENCABEZADO ================= */}
      <header className="mc-hero">
        <div>
          <span className="mc-hero-sub"><FaGraduationCap /> Mi aprendizaje</span>
          <h2>Mis cursos</h2>
          <p>Retoma tus cursos donde te quedaste y revisa el estado de tus inscripciones.</p>
        </div>
        <div className="mc-hero-cifras">
          <div><strong>{conteo("curso")}</strong><span>en curso</span></div>
          <div><strong>{conteo("terminado")}</strong><span>terminados</span></div>
          <div><strong>{conteo("pago")}</strong><span>por pagar</span></div>
        </div>
      </header>

      <div className="mc-filtros" role="tablist">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            role="tab"
            aria-selected={filtro === f.valor}
            className={filtro === f.valor ? "activo" : ""}
            onClick={() => setFiltro(f.valor)}
          >
            {f.texto} <span>{conteo(f.valor)}</span>
          </button>
        ))}
      </div>

      {/* ================= LISTADO ================= */}
      {loading ? (
        <div className="cc-grid">
          {[1, 2, 3].map((n) => <div key={n} className="cc-tarjeta cc-esqueleto" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="cv-vacio">
          <FaBookOpen />
          <p>Aún no estás inscrito en ningún curso.</p>
          <Link to="/principal" className="cv-btn">Explorar el campus</Link>
        </div>
      ) : visibles.length === 0 ? (
        <div className="cv-vacio"><p>No tienes cursos en esta sección.</p></div>
      ) : (
        <div className="cc-grid">
          {visibles.map(({ curso, inscripcion, progreso: p, grupo }) => {
            const portada = portadaCurso(curso);
            const avance = p?.progreso ?? 0;
            return (
              <article key={inscripcion.id} className={`cc-tarjeta cc-${grupo}`}>
                <div className="cc-portada" style={portada ? undefined : { background: degradadoCurso(curso.nombre) }}>
                  {portada ? <img src={portada} alt="" loading="lazy" /> : <span className="cc-iniciales">{inicialesCurso(curso.nombre)}</span>}
                  {grupo === "terminado" && <span className="cc-insignia cc-insignia-ok"><FaTrophy /> Terminado</span>}
                  {grupo === "pago" && <span className="cc-insignia cc-insignia-alerta"><FaMoneyBillWave /> Pago pendiente</span>}
                  {p?.en_riesgo && grupo === "curso" && <span className="cc-insignia cc-insignia-peligro"><FaExclamationTriangle /> Necesita atención</span>}
                </div>

                <div className="cc-cuerpo">
                  <h3>{curso.nombre}</h3>
                  {curso.profesor && <span className="cc-profesor"><FaChalkboardTeacher /> {curso.profesor}</span>}

                  {grupo !== "pago" ? (
                    <>
                      <div className="cc-progreso">
                        <div className="cc-progreso-fila">
                          <span>Avance</span>
                          <strong>{Math.round(avance)}%</strong>
                        </div>
                        <div className="cc-barra"><span style={{ width: `${avance}%` }} /></div>
                      </div>
                      <div className="cc-datos">
                        <span><FaBookOpen /> {p ? `${p.lecciones_vistas}/${p.total_lecciones}` : "—"} lecciones</span>
                        <span>
                          Promedio{" "}
                          <b style={{ color: colorCalificacion(p?.promedio) }}>{p?.promedio !== null && p?.promedio !== undefined ? `${p.promedio}%` : "—"}</b>
                        </span>
                      </div>
                      {p?.dias_inactivo !== null && p?.dias_inactivo !== undefined && grupo === "curso" && (
                        <small className="cc-actividad"><FaClock /> {p.dias_inactivo === 0 ? "Activo hoy" : `Última actividad hace ${p.dias_inactivo} ${p.dias_inactivo === 1 ? "día" : "días"}`}</small>
                      )}
                      {p?.siguiente_leccion && grupo === "curso" && (
                        <small className="cc-siguiente">Sigue: <b>{p.siguiente_leccion}</b></small>
                      )}
                      {p?.terminado_aprobado && (
                        <Link to={`/principal/certificado/${curso.id}`} className="cv-btn cv-btn-oro cv-btn-ancho">
                          <FaAward /> Ver certificado
                        </Link>
                      )}
                      <Link to={`/principal/cursos/${curso.id}`} className={`cv-btn cv-btn-ancho${p?.terminado_aprobado ? " cv-btn-suave" : ""}`}>
                        {grupo === "terminado" ? <>Repasar curso <FaArrowRight /></> : avance > 0 ? <><FaPlay /> Continuar</> : <><FaPlay /> Empezar</>}
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="cc-pago">
                        <EstadoInscripcion estado={inscripcion.estado} />
                        {inscripcion.monto > 0 && <span>Monto: <b>{formatoMoneda(inscripcion.monto)}</b></span>}
                        {inscripcion.referencia_pago && <span>ID de pago: <code>{inscripcion.referencia_pago}</code></span>}
                        {inscripcion.estado === "rechazada" && inscripcion.motivo_rechazo && (
                          <span className="insc-motivo">Motivo: {inscripcion.motivo_rechazo}</span>
                        )}
                      </div>
                      <button type="button" className="cv-btn cv-btn-ancho cv-btn-alerta" onClick={() => setPagoAbierto(inscripcion)}>
                        {inscripcion.estado === "en_revision"
                          ? <><FaCheckCircle /> Ver detalle del pago</>
                          : inscripcion.estado === "rechazada"
                            ? "Subir nuevo comprobante"
                            : <><FaMoneyBillWave /> Pagar y subir comprobante</>}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

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
