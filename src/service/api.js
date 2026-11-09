import axios from 'axios';
import { API_URL } from "../config";

// La URL base de la API viene de src/config.js (variable VITE_API_URL)

// --- Registro de usuario ---
export const registrarUsuario = (data) =>
  axios.post(`${API_URL}/registrar`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Login de usuario ---
export const loginUsuario = (data) =>
  axios.post(`${API_URL}/login`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Recuperar contraseña ---
export const recuperarContraseña = (id, data) =>
  axios.put(`${API_URL}/recuperar_contraseña/${id}`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Obtener todos los usuarios ---
export const obtenerUsuarios = () =>
  axios.get(`${API_URL}/usuarios`, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Obtener usuario por ID ---
export const obtenerUsuarioPorId = (id) =>
  axios.get(`${API_URL}/usuarios/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Actualizar usuario ---
export const actualizarUsuario = (id, data) =>
  axios.put(`${API_URL}/usuarios/${id}`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Eliminar usuario ---
export const eliminarUsuario = (id) =>
  axios.delete(`${API_URL}/usuarios/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Confirmar correo con el token del enlace ---
export const verificarCorreo = (token) =>
  axios.post(`${API_URL}/verificar-correo`, { token }, {
    headers: { 'Content-Type': 'application/json' },
  });

// --- Reenviar el correo de confirmación ---
export const reenviarVerificacion = (email) =>
  axios.post(`${API_URL}/reenviar-verificacion`, { email }, {
    headers: { 'Content-Type': 'application/json' },
  });
