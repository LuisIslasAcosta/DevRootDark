import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import Reproductor from "./Reproductor.jsx";

// App del administrador: igual al reproductor normal + panel oculto de respaldos
// (secuencia secreta y login de administrador; el servidor vuelve a validar el rol).
const PanelSecreto = lazy(() => import("./admin/PanelSecreto.jsx"));

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <Reproductor PanelSecreto={PanelSecreto} />
  </StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/reproductor-admin/sw.js", { scope: "/reproductor-admin/" }).catch((err) =>
      console.error("No se pudo registrar el service worker del reproductor:", err)
    );
  });
}
