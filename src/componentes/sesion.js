// Guarda la sesión igual que el login normal y redirige según el rol
export function guardarSesion(data, navigate) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("acceptedTerms", "true");
  localStorage.setItem("rol", data.usuario.rol);
  localStorage.setItem("usuario", JSON.stringify(data.usuario));
  localStorage.setItem("user_id", data.usuario.id);

  if (data.usuario.rol === "administrador") navigate("/admin");
  else if (data.usuario.rol === "profesor") navigate("/profesor");
  else navigate("/principal");
}
