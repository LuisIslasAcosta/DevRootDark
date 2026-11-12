// Texto de los términos y condiciones / políticas de DevRootDark.
// Lo usan la página /politicas y la ventana que pide aceptarlos.
//
// IMPORTANTE: si cambias este texto, cambia también TERMINOS_VERSION en el .env del servidor
// (y reinicia la API). Así todos los usuarios tendrán que aceptar la nueva versión al entrar.

export const TERMINOS_TITULO = "Términos, condiciones y políticas de privacidad";

export const TERMINOS = [
  {
    titulo: "Horario de mantenimiento programado.",
    texto: "Debido a labores de mantenimiento preventivo del servidor, la plataforma estará desactivada de 2:00 a 3:00 de la mañana los días domingo. Los usuarios serán notificados con 24 horas de anticipación para evitar molestias o insatisfacciones.",
  },
  {
    titulo: "Actualizaciones.",
    texto: "Las actualizaciones críticas, como las de seguridad o la incorporación de nuevas funciones en la plataforma, se realizarán en el mismo horario de mantenimiento para evitar interrupciones prolongadas del servicio.",
  },
  {
    titulo: "Disponibilidad del servicio.",
    texto: "El servicio estará disponible al menos el 99% del tiempo mensual.",
  },
  {
    titulo: "Comunicación.",
    texto: "Los usuarios serán notificados mediante correo electrónico sobre los horarios de mantenimiento, actualizaciones o interrupciones del servicio. Además, se mostrará un mensaje en la parte superior de la aplicación para mantenerlos informados sobre cualquier cambio o actualización en la plataforma.",
  },
  {
    titulo: "Soporte.",
    texto: "En caso de alguna falla en la plataforma, se contará con un tiempo estimado de 2 a 3 horas para corregir el problema y restaurar el sistema. Si el tiempo se amplía, el usuario será notificado vía correo electrónico.",
  },
  {
    titulo: "Recuperación y bloqueo.",
    texto: "En caso de pérdida de la cuenta o contraseña, se podrá recuperar mediante un área determinada de la plataforma. Si el usuario no logra acceder, deberá comunicarse con el administrador para la recuperación de la cuenta, proporcionando los datos personales registrados al momento de crearla para verificar su identidad. Todo este proceso se realizará dentro de la plataforma.",
  },
];
