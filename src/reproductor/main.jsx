import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Reproductor from "./Reproductor.jsx";

// App normal para alumnos: NO incluye el panel de respaldos
createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <Reproductor />
  </StrictMode>
);

// Service worker propio del reproductor (solo controla /reproductor/)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/reproductor/sw.js", { scope: "/reproductor/" }).catch((err) =>
      console.error("No se pudo registrar el service worker del reproductor:", err)
    );
  });
}
