// utils/offlineSync.js
// Utilidades para la arquitectura offline-first: exponer el estado de
// conexión y permitir forzar re-habilitación de red tras una reconexión.

import { enableNetwork, disableNetwork, waitForPendingWrites } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Suscribe un callback a los eventos online/offline del navegador.
 * Complementa (no reemplaza) el manejo interno de reconexión de Firestore.
 */
export function suscribirseAConectividad(callback) {
  const manejarCambio = () => callback(navigator.onLine);
  window.addEventListener("online", manejarCambio);
  window.addEventListener("offline", manejarCambio);
  callback(navigator.onLine); // estado inicial

  return () => {
    window.removeEventListener("online", manejarCambio);
    window.removeEventListener("offline", manejarCambio);
  };
}

/** Fuerza a Firestore a dejar de intentar conectarse (modo avión manual). */
export function forzarModoOffline() {
  return disableNetwork(db);
}

/** Reactiva la conexión de Firestore tras un `forzarModoOffline`. */
export function reactivarConexion() {
  return enableNetwork(db);
}

/**
 * Devuelve una promesa que se resuelve cuando todas las escrituras locales
 * pendientes (hechas mientras no había red) fueron confirmadas por el
 * servidor. Útil para mostrar un indicador de "sincronizado".
 */
export function esperarEscriturasPendientes() {
  return waitForPendingWrites(db);
}
