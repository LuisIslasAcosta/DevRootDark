import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import ModalTerminos from "../componentes/ModalTerminos";

const cerrarSesion = () => {
  ["token", "isLoggedIn", "acceptedTerms", "rol", "usuario", "user_id"].forEach((k) => localStorage.removeItem(k));
};

/**
 * Para sesiones ya abiertas: revisa con la API si el usuario aceptó la versión vigente
 * de los términos. Si no (por ejemplo, porque se actualizaron), muestra la ventana
 * y no deja usar la plataforma hasta aceptarlos.
 */
function TerminosGuard({ children }) {
  const navigate = useNavigate();
  const [pendiente, setPendiente] = useState(null); // datos de la API cuando hay que aceptar
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    let activo = true;
    axios
      .get(`${API_URL}/terminos/estado`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (activo && data.pendiente) setPendiente(data); })
      .catch((err) => {
        // Sesión vencida o inválida: volver a iniciar sesión
        if (activo && [401, 422].includes(err.response?.status)) {
          cerrarSesion();
          navigate("/login", { replace: true });
        }
      });
    return () => { activo = false; };
  }, [navigate]);

  const aceptar = async () => {
    setGuardando(true);
    setError("");
    try {
      await axios.post(
        `${API_URL}/terminos/aceptar`,
        { acepta_terminos: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      localStorage.setItem("acceptedTerms", "true");
      setPendiente(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {children}
      {pendiente && (
        <ModalTerminos
          version={pendiente.version}
          actualizacion={pendiente.actualizacion}
          cargando={guardando}
          error={error}
          textoCancelar="Cerrar sesión"
          onAceptar={aceptar}
          onCancelar={salir}
        />
      )}
    </>
  );
}

export default TerminosGuard;
