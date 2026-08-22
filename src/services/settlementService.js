// services/settlementService.js
// Cálculo del saldo neto de cada miembro a partir de los gastos, y algoritmo
// de simplificación de deudas para minimizar el número de transacciones.

/**
 * Calcula el saldo neto de cada participante a partir de la lista de gastos.
 * Saldo positivo = le deben dinero (pagó de más). Saldo negativo = debe dinero.
 *
 * @param {Array<{pagadoPor: string, division: Record<string, number>}>} gastos
 * @returns {Record<string, number>} uid -> saldo neto (redondeado a centavos)
 */
export function calcularSaldosNetos(gastos) {
  const saldos = {};

  const acreditar = (uid, monto) => {
    saldos[uid] = (saldos[uid] ?? 0) + monto;
  };

  for (const gasto of gastos) {
    // Quien pagó se acredita el monto total del gasto.
    acreditar(gasto.pagadoPor, gasto.monto);
    // Cada participante se debita su parte de la división.
    for (const [uid, parte] of Object.entries(gasto.division)) {
      acreditar(uid, -parte);
    }
  }

  // Redondeo a centavos para evitar arrastre de errores de coma flotante.
  for (const uid of Object.keys(saldos)) {
    saldos[uid] = Math.round(saldos[uid] * 100) / 100;
  }

  return saldos;
}

/**
 * Algoritmo greedy de simplificación de deudas: en cada paso empareja al
 * mayor deudor con el mayor acreedor, minimizando la cantidad de
 * transacciones necesarias para saldar todas las deudas del grupo.
 *
 * Es óptimo (o muy cercano al óptimo) para el caso general y de complejidad
 * O(n log n), suficiente para el tamaño de grupo esperado en esta app.
 *
 * @param {Record<string, number>} saldosNetos
 * @returns {Array<{de: string, para: string, monto: number}>} transacciones sugeridas
 */
export function simplificarDeudas(saldosNetos) {
  const EPSILON = 0.005; // tolerancia para considerar un saldo como "saldado"

  const deudores = [];
  const acreedores = [];

  for (const [uid, saldo] of Object.entries(saldosNetos)) {
    if (saldo < -EPSILON) deudores.push({ uid, monto: -saldo });
    else if (saldo > EPSILON) acreedores.push({ uid, monto: saldo });
  }

  deudores.sort((a, b) => b.monto - a.monto);
  acreedores.sort((a, b) => b.monto - a.monto);

  const transacciones = [];
  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];
    const montoTransaccion = Math.round(Math.min(deudor.monto, acreedor.monto) * 100) / 100;

    if (montoTransaccion > EPSILON) {
      transacciones.push({
        de: deudor.uid,
        para: acreedor.uid,
        monto: montoTransaccion,
      });
    }

    deudor.monto -= montoTransaccion;
    acreedor.monto -= montoTransaccion;

    if (deudor.monto <= EPSILON) i += 1;
    if (acreedor.monto <= EPSILON) j += 1;
  }

  return transacciones;
}

/**
 * Función de conveniencia que combina ambos pasos: de gastos crudos a
 * transacciones de liquidación sugeridas.
 */
export function calcularLiquidacion(gastos) {
  const saldos = calcularSaldosNetos(gastos);
  const transacciones = simplificarDeudas(saldos);
  return { saldos, transacciones };
}
