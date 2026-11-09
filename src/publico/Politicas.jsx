import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/politicas.css';
import '../temas/temas.css';
import Logo from '../componentes/Logo';

function Politicas() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  // Respetar el tema elegido por el usuario
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "light");
  }, []);

  const handleAceptar = () => {
    localStorage.setItem('politicas', 'aceptadas');
    navigate('/');
  };

  return (
    <div className="politicas-pagina">
     <div className="politicas-tarjeta">
      <Link to="/" className="auth-logo" aria-label="Volver al inicio">
        <Logo variante="banner" />
      </Link>
      <h1>Políticas de Privacidad y Mantenimiento</h1>
      <p className="politicas-intro">Lee con atención cómo cuidamos el servicio y tu cuenta.</p>

      <ol className="politicas-lista">
        <li>
          <strong>Horario de mantenimiento programado.</strong>
          Debido a labores de mantenimiento preventivo del servidor, la plataforma estará desactivada de 2:00 a 3:00 de la mañana los días domingo. 
          Los usuarios serán notificados con 24 horas de anticipación para evitar molestias o insatisfacciones.
        </li>
        <li>
          <strong>Actualizaciones.</strong>
          Las actualizaciones críticas, como las de seguridad o la incorporación de nuevas funciones en la plataforma, se realizarán en el mismo horario de mantenimiento para evitar interrupciones prolongadas del servicio.
        </li>
        <li>
          <strong>Disponibilidad del servicio.</strong>
          El servicio estará disponible al menos el 99% del tiempo mensual.
        </li>
        <li>
          <strong>Comunicación.</strong>
          Los usuarios serán notificados mediante correo electrónico sobre los horarios de mantenimiento, actualizaciones o interrupciones del servicio. 
          Además, se mostrará un mensaje en la parte superior de la aplicación para mantenerlos informados sobre cualquier cambio o actualización en la plataforma.
        </li>
        <li>
          <strong>Soporte.</strong>
          En caso de alguna falla en la plataforma, se contará con un tiempo estimado de 2 a 3 horas para corregir el problema y restaurar el sistema. 
          Si el tiempo se amplía, el usuario será notificado vía correo electrónico.
        </li>
        <li>
          <strong>Recuperación y bloqueo.</strong>
          En caso de pérdida de la cuenta o contraseña, se podrá recuperar mediante un área determinada de la plataforma. 
          Si el usuario no logra acceder, deberá comunicarse con el administrador para la recuperación de la cuenta, proporcionando los datos personales registrados al momento de crearla para verificar su identidad. 
          Todo este proceso se realizará dentro de la plataforma.
        </li>
      </ol>

      <div className="politicas-acciones">
        <label>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          He leído y acepto las políticas
        </label>

        <div className="politicas-botones">
          <Link to="/">Volver al inicio</Link>
          <button onClick={handleAceptar} disabled={!accepted}>
            Aceptar
          </button>
        </div>
      </div>
     </div>
    </div>
  );
}

export default Politicas;