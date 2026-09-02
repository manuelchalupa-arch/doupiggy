// utils/nivelSaldo.js
// Traduce el saldo neto del usuario a una de las 5 zonas visuales que ya
// existen como fondos (backgroundAssets.nivel). Antes este cálculo vivía
// duplicado dentro de HomeSummary; ahora vive acá una sola vez porque
// AppShell lo necesita para aplicar el fondo correspondiente en TODAS las
// pestañas, no solo en Inicio.

import { calcularBalanceGrupo } from "./calcularDeudas";

export const UMBRAL_NEUTRO = 500;
export const UMBRAL_ALTO = 5000;

/**
 * Saldo neto real del usuario: positivo = le deben, negativo = debe.
 *
 * FUENTE ÚNICA DE BALANCE: delega en `calcularBalanceGrupo` (el mismo core
 * que usa `calcularDeudas`/Resumen), así Inicio y Resumen nunca divergen.
 * El miembro activo se deriva de los gastos (participantes ∪ quien pagó),
 * que alcanza para calcular su neto; no hace falta la lista de miembros.
 */
export function calcularSaldoUsuario(gastos, uidActual, pagosConfirmados = []) {
  const uids = new Set();
  for (const g of gastos || []) {
    uids.add(g?.pagadoPor);
    for (const p of g?.participantes || []) uids.add(p);
  }
  const miembros = [...uids].filter(Boolean).map((uid) => ({ uid, nombre: uid }));
  const { resumen } = calcularBalanceGrupo(gastos, miembros, pagosConfirmados);
  return Math.round((resumen[uidActual]?.neto || 0) * 100) / 100;
}

/**
 * Zona visual según el saldo. OJO: el orden NO es "1 a 5" en el sentido en
 * que podría sugerir el nombre de archivo — se verificó el contenido real
 * de cada imagen y bg-level1 es la escena mala (tornado + casa incendiada)
 * mientras que bg-level5 es la buena (sol + arcoíris). El mapeo respeta el
 * contenido real de cada imagen, no un orden numérico literal.
 */
export function calcularNivel(saldo) {
  if (saldo <= -UMBRAL_ALTO) return "muy-debe";
  if (saldo <= -UMBRAL_NEUTRO) return "debe";
  if (saldo >= UMBRAL_ALTO) return "le-deben-mucho";
  if (saldo >= UMBRAL_NEUTRO) return "le-deben";
  return "neutral";
}
