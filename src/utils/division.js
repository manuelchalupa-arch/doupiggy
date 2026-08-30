// src/utils/division.js
// Fuente única para saber cuánto le corresponde a cada participante de un
// gasto. Los gastos nuevos guardan la división exacta en centavos (campo
// `division`, lo arma expenseService.calcularDivisionIgualitaria); los
// gastos viejos no la tienen, entonces acá se cae a monto/partes como
// respaldo. Todo cálculo de saldos de la app (Inicio, Resumen, Liquidación,
// informes) debe pasar por esta función para nunca descuadrarse con lo
// que se guardó en la base.

/**
 * @param {{monto: number, participantes?: string[], division?: Record<string, number>}} gasto
 * @param {string} uid
 * @returns {number} parte (con centavos) que le toca a `uid`
 */
export function parteDeGasto(gasto, uid) {
  const parte = gasto.division?.[uid];
  if (typeof parte === "number") return parte;
  const partes = gasto.participantes?.length || 1;
  return gasto.monto / partes;
}