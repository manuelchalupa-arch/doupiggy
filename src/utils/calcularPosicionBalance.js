// utils/calcularPosicionBalance.js
// Traduce el balance económico REAL del usuario a una posición normalizada
// sobre el recorrido de la soga de la escena "tira y afloje":
//
//   0.0 = extremo izquierdo (te deben MUCHO: la soga se va hacia el cerdito rico)
//   0.5 = equilibrio
//   1.0 = extremo derecho (debés MUCHO: la soga se va hacia el cerdito humilde)
//
// Lógica financiera y lógica visual quedan separadas: esta función solo
// consume los datos y devuelve un número; la escena no conoce nada de gastos
// ni deudas. Se reutiliza calcularSaldoUsuario (la fórmula económica real de
// la app) sin tocarla: acá solo se la normaliza.
//
// La escala es lineal y simétrica: saldo = ±UMBRAL_ALTO (5000 ARS) llega a los
// extremos 0.0 / 1.0. Cualquier saldo mayor se recorta al extremo permitido.

import { calcularSaldoUsuario, UMBRAL_ALTO } from "./nivelSaldo";

/**
 * @param {Array} gastos - gastos del grupo (misma forma que usa la app)
 * @param {string} uidActual - uid del usuario activo
 * @param {Array} [pagosConfirmados] - pagos recibidos confirmados
 * @returns {number} posición normalizada dentro de [0, 1]
 */
export function calcularPosicionBalance(gastos, uidActual, pagosConfirmados = []) {
  const saldo = calcularSaldoUsuario(gastos, uidActual, pagosConfirmados);
  // Positivo (le deben) tira hacia la izquierda; negativo (debe) tira a la derecha.
  const posicion = 0.5 - saldo / (2 * UMBRAL_ALTO);
  return Math.max(0, Math.min(1, posicion));
}