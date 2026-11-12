import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/politicas.css';
import '../temas/temas.css';
import Logo from '../componentes/Logo';
import { TERMINOS, TERMINOS_TITULO } from '../data/terminos';
import { API_URL } from '../config';

function Politicas() {
  const navigate = useNavigate();
  const [version, setVersion] = useState("");

  // Respetar el tema elegido por el usuario
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "light");
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/terminos`).then((r) => r.json()).then((d) => setVersion(d.version || "")).catch(() => {});
  }, []);

  return (
    <div className="politicas-pagina">
     <div className="politicas-tarjeta">
      <Link to="/" className="auth-logo" aria-label="Volver al inicio">
        <Logo variante="banner" />
      </Link>
      <h1>{TERMINOS_TITULO}</h1>
      <p className="politicas-intro">Lee con atención cómo cuidamos el servicio y tu cuenta.</p>

      {version && <p className="politicas-intro">Versión vigente: {version}</p>}

      <ol className="politicas-lista">
        {TERMINOS.map((t) => (
          <li key={t.titulo}>
            <strong>{t.titulo}</strong>
            {t.texto}
          </li>
        ))}
      </ol>

      <div className="politicas-acciones">
        <p>
          Al crear tu cuenta o iniciar sesión se te pedirá aceptar estos términos.
          Si se actualizan, se te pedirá aceptarlos de nuevo.
        </p>
        <div className="politicas-botones">
          <Link to="/">Volver al inicio</Link>
          <button onClick={() => navigate(-1)}>Regresar</button>
        </div>
      </div>
     </div>
    </div>
  );
}

export default Politicas;