import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api'; // Base de la API

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