import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initInstalacionPwa } from "./services/instalacionPwa";

// Captura antes de que exista cualquier pantalla el evento de instalación
// (beforeinstallprompt) y lo deja listo para el botón de "Descargar e
// instalar" de la pantalla Info.
initInstalacionPwa();

// Registro del service worker (requisito para que el navegador ofrezca
// instalar la app). Solo en https o localhost.
if (
  "serviceWorker" in navigator &&
  (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);