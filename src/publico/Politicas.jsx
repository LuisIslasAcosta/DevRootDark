import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/politicas.css';

function Politicas() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAceptar = () => {
    localStorage.setItem('politicas', 'aceptadas');
    navigate('/');
  };

  return (
    <div className="politicas-container">
      <h2>Políticas de Privacidad y Mantenimiento</h2>

      <ol>
        <li>
          <strong>Horario de mantenimiento programado.</strong><br />
          Debido a labores de mantenimiento preventivo del servidor, la plataforma estará desactivada de 2:00 a 3:00 de la mañana los días domingo. 
          Los usuarios serán notificados con 24 horas de anticipación para evitar molestias o insatisfacciones.
        </li>
        <li>
          <strong>Actualizaciones.</strong><br />
          Las actualizaciones críticas, como las de seguridad o la incorporación de nuevas funciones en la plataforma, se realizarán en el mismo horario de mantenimiento para evitar interrupciones prolongadas del servicio.
        </li>
        <li>
          <strong>Disponibilidad del servicio.</strong><br />
          El servicio estará disponible al menos el 99% del tiempo mensual.
        </li>
        <li>
          <strong>Comunicación.</strong><br />
          Los usuarios serán notificados mediante correo electrónico sobre los horarios de mantenimiento, actualizaciones o interrupciones del servicio. 
          Además, se mostrará un mensaje en la parte superior de la aplicación para mantenerlos informados sobre cualquier cambio o actualización en la plataforma.
        </li>
        <li>
          <strong>Soporte.</strong><br />
          En caso de alguna falla en la plataforma, se contará con un tiempo estimado de 2 a 3 horas para corregir el problema y restaurar el sistema. 
          Si el tiempo se amplía, el usuario será notificado vía correo electrónico.
        </li>
        <li>
          <strong>Recuperación y bloqueo.</strong><br />
          En caso de pérdida de la cuenta o contraseña, se podrá recuperar mediante un área determinada de la plataforma. 
          Si el usuario no logra acceder, deberá comunicarse con el administrador para la recuperación de la cuenta, proporcionando los datos personales registrados al momento de crearla para verificar su identidad. 
          Todo este proceso se realizará dentro de la plataforma.
        </li>
      </ol>

      <label>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        He leído y acepto las políticas
      </label>

      <button onClick={handleAceptar} disabled={!accepted}>
        Aceptar
      </button>

      <div>
        <Link to="/">Volver a la página principal</Link>
      </div>
    </div>
  );
}

export default Politicas;