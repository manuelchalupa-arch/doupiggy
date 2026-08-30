// services/instalacionPwa.js
// Puente entre el navegador y la UI de "Descargar e instalar" (PWA).
// Captura el evento beforeinstallprompt de forma global (puede dispararse
// antes de que se monte cualquier pantalla de la app) y lo expone a los
// componentes que lo necesiten, con un mini-suscriptor.

let promptEvent = null;
const suscriptores = new Set();

export function initInstalacionPwa() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    // El navegador pregunta por su cuenta si no lo frenamos; queremos que
    // pregunte recién cuando el usuario toque nuestro botón.
    e.preventDefault();
    promptEvent = e;
    notificar();
  });

  window.addEventListener("appinstalled", () => {
    promptEvent = null;
    notificar();
  });
}

/** Último beforeinstallprompt capturado (o null si no hay). */
export function obtenerPromptInstalacion() {
  return promptEvent;
}

/** true si la app ya corre como instalada (standalone). */
export function estaInstalada() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/** Se suscribe a cambios (llega el prompt / se instaló). Devuelve el unsub. */
export function suscribirse(fn) {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}

function notificar() {
  suscriptores.forEach((fn) => fn());
}