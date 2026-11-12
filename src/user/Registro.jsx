import React, { useState } from "react";
import { registrarUsuario, reenviarVerificacion } from "../service/api";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheck, FaEnvelopeOpenText, FaCheckCircle } from "react-icons/fa";
import AuthLayout from "./AuthLayout";
import BotonGoogle from "../componentes/BotonGoogle";

// Mismas reglas que valida la API al registrar
const REGLAS = [
  { texto: "12 caracteres o más", cumple: (p) => p.length >= 12 },
  { texto: "Una mayúscula", cumple: (p) => /[A-Z]/.test(p) },
  { texto: "Una minúscula", cumple: (p) => /[a-z]/.test(p) },
  { texto: "Un número", cumple: (p) => /\d/.test(p) },
  { texto: "Un símbolo (!@#$%...)", cumple: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const PREGUNTAS = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad naciste?",
  "¿Cuál es tu comida favorita?",
  "¿Cómo se llamaba tu escuela primaria?",
  "¿Cuál es el segundo nombre de tu mamá?",
];

function Campo({ etiqueta, ayuda, ancho, children }) {
  return (
    <label className={`au-campo ${ancho === "completo" ? "au-campo--completo" : ""}`}>
      <span className="au-campo__etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="au-campo__ayuda">{ayuda}</span>}
    </label>
  );
}

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidop: "",
    apellidom: "",
    fecha_nacimiento: "",
    pais: "",
    ciudad: "",
    email: "",
    password: "",
    verificar_password: "",
    foto_perfil: "",
    pregunta_seguridad: "",
    respuesta_seguridad: "",
    telefono: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [registrado, setRegistrado] = useState(null); // { email, requiere_verificacion, mensaje }
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const coinciden = formData.verificar_password.length > 0 && formData.password === formData.verificar_password;
  const contrasenaValida = REGLAS.every((r) => r.cumple(formData.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contrasenaValida) {
      setMensaje("La contraseña todavía no cumple todos los requisitos.");
      return;
    }
    if (!coinciden) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }
    try {
      setEnviando(true);
      setMensaje("");
      const response = await registrarUsuario(formData);
      setRegistrado({ email: formData.email, ...response.data });
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || "Error al registrar usuario");
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    try {
      const res = await reenviarVerificacion(registrado.email);
      setAviso(res.data?.mensaje || "Correo reenviado.");
    } catch (error) {
      setAviso(error.response?.data?.mensaje || "No se pudo reenviar el correo.");
    }
  };

  // Pantalla después de registrarse
  if (registrado) {
    return (
      <AuthLayout>
        <div className="au-estado">
          <span className="au-estado__icono" aria-hidden="true">
            {registrado.requiere_verificacion ? <FaEnvelopeOpenText /> : <FaCheckCircle />}
          </span>
          <h1>{registrado.requiere_verificacion ? "Revisa tu correo" : "¡Cuenta creada!"}</h1>
          <p className="au-aviso au-aviso--ok">{registrado.mensaje}</p>
          {registrado.requiere_verificacion && (
            <>
              <p className="au-estado__detalle">
                Abre el correo que enviamos a <strong>{registrado.email}</strong> y presiona
                «Confirmar mi correo». El enlace vence en 24 horas.
              </p>
              <button type="button" className="au-boton au-boton--secundario" onClick={reenviar}>Reenviar correo</button>
              {aviso && <p className="au-aviso au-aviso--info">{aviso}</p>}
            </>
          )}
          <Link to="/login" className="au-boton">Ir a iniciar sesión</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout ancho="amplio" titulo="Crea tu cuenta" subtitulo="Es gratis y solo toma un minuto.">
      <div className="au-google au-google--arriba">
        <BotonGoogle texto="signup_with" />
      </div>
      <p className="au-separador"><span>o regístrate con tu correo</span></p>

      <form className="au-form" onSubmit={handleSubmit}>
        <fieldset className="au-grupo">
          <legend>Datos personales</legend>
          <div className="au-rejilla">
            <Campo etiqueta="Nombre">
              <input type="text" name="nombre" placeholder="Ana" autoComplete="given-name" value={formData.nombre} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Apellido paterno">
              <input type="text" name="apellidop" placeholder="García" autoComplete="family-name" value={formData.apellidop} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Apellido materno">
              <input type="text" name="apellidom" placeholder="López" value={formData.apellidom} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Fecha de nacimiento">
              <input type="date" name="fecha_nacimiento" autoComplete="bday" value={formData.fecha_nacimiento} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="País">
              <input type="text" name="pais" placeholder="México" autoComplete="country-name" value={formData.pais} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Ciudad">
              <input type="text" name="ciudad" placeholder="Toluca" autoComplete="address-level2" value={formData.ciudad} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Teléfono (opcional)" ancho="completo">
              <input type="tel" name="telefono" placeholder="722 123 4567" autoComplete="tel" value={formData.telefono} onChange={handleChange} />
            </Campo>
          </div>
        </fieldset>

        <fieldset className="au-grupo">
          <legend>Tu cuenta</legend>
          <div className="au-rejilla">
            <Campo etiqueta="Correo electrónico" ayuda="Te enviaremos un enlace para confirmarlo." ancho="completo">
              <input type="email" name="email" placeholder="tu@correo.com" autoComplete="email" value={formData.email} onChange={handleChange} required />
            </Campo>
            <Campo etiqueta="Contraseña">
              <span className="au-campo__control">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Crea una contraseña"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="au-ojo" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </Campo>
            <Campo
              etiqueta="Confirmar contraseña"
              ayuda={formData.verificar_password ? (coinciden ? "✓ Las contraseñas coinciden" : "Las contraseñas no coinciden") : null}
            >
              <span className="au-campo__control">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="verificar_password"
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  value={formData.verificar_password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="au-ojo" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </Campo>
          </div>
          <ul className="au-reglas" aria-label="Requisitos de la contraseña">
            {REGLAS.map((r) => {
              const ok = r.cumple(formData.password);
              return (
                <li key={r.texto} className={ok ? "au-reglas--ok" : ""}>
                  <span className="au-reglas__marca" aria-hidden="true">{ok && <FaCheck />}</span>
                  {r.texto}
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset className="au-grupo">
          <legend>Recuperación de cuenta</legend>
          <div className="au-rejilla">
            <Campo etiqueta="Pregunta de seguridad" ayuda="Elige una sugerencia o escribe la tuya.">
              <input
                type="text"
                name="pregunta_seguridad"
                list="au-preguntas"
                placeholder="¿Cuál es el nombre de tu primera mascota?"
                value={formData.pregunta_seguridad}
                onChange={handleChange}
                required
              />
              <datalist id="au-preguntas">
                {PREGUNTAS.map((p) => <option key={p} value={p} />)}
              </datalist>
            </Campo>
            <Campo etiqueta="Respuesta">
              <input type="text" name="respuesta_seguridad" placeholder="Tu respuesta" value={formData.respuesta_seguridad} onChange={handleChange} required />
            </Campo>
          </div>
        </fieldset>

        {mensaje && <p className="au-aviso au-aviso--error" role="alert">{mensaje}</p>}

        <p className="au-legal">
          Al crear tu cuenta aceptas nuestras <Link to="/politicas" className="au-enlace">políticas de privacidad</Link>.
        </p>

        <button type="submit" className="au-boton" disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="au-cambio">
        ¿Ya tienes cuenta? <Link to="/login" className="au-enlace">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
};

export default Registro;
