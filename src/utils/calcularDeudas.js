// src/utils/calcularDeudas.js
// Cálculo deudas del grupo (Resumen), en dos niveles:
//   - pares: lo neto que cada uno debe a cada uno (se descuentan pagos
//     cruzados del mismo par: si A debe $100 a B y B debe $40 a A, queda
//     A debe $60 a B). También se descuentan los pagos que el acreedor ya
//     confirmó como recibidos (pagosConfirmados): lo que ya se cobró ya no
//     figura como deuda pendiente.
//   - resumen: por miembro, total que debe, total que le deben, saldo neto
//     y el detalle con quién. Convención de signo igual que
//     nivelSaldo/calcularSaldoUsuario: neto positivo = le deben (a favor).

import { parteDeGasto } from "./division";

/**
 * @param {Array<{uid: string, nombre: string}>} miembros
 * @param {Array} gastos - cada gasto con pagadoPor, participantes[], monto y division
 * @param {Array} [pagosConfirmados] - pagos recibidos confirmados, cada uno
 *   { de: uid del que pagó, para: uid que cobró, monto }
 * @returns {{ pares: Array, resumen: Object }}
 */
export function calcularDeudas(gastos, miembros, pagosConfirmados = []) {
  const nombres = {};
  for (const m of miembros) nombres[m.uid] = m.nombre;

  // Deuda bruta: bruto[deudor][acreedor] = monto que debe "deudor" a "acreedor".
  // Se usa la división exacta guardada en cada gasto (parteDeGasto) para que
  // nunca descuadre con lo que se guardó en la base.
  const bruto = {};
  for (const g of gastos) {
    for (const p of g.participantes || []) {
      if (p !== g.pagadoPor) {
        const parte = parteDeGasto(g, p);
        bruto[p] = bruto[p] || {};
        bruto[p][g.pagadoPor] = (bruto[p][g.pagadoPor] || 0) + parte;
      }
    }
  }

  // Pagos que el acreedor ya confirmó como recibidos: se descuentan de la
  // deuda bruta del par (de → para) para que la liquidación refleje lo que
  // efectivamente falta cobrar. El piso en 0 evita saldos negativos por
  // sobre-pago; si un lado queda cubierto, el par simplemente desaparece o
  // rota el sentido en el neto de abajo.
  const confirmadoPorPar = {};
  for (const p of pagosConfirmados || []) {
    const clave = `${p.de}\u0000${p.para}`;
    confirmadoPorPar[clave] = (confirmadoPorPar[clave] || 0) + p.monto;
  }
  for (const [clave, montoConfirmado] of Object.entries(confirmadoPorPar)) {
    const sep = clave.indexOf("\u0000");
    const de = clave.slice(0, sep);
    const para = clave.slice(sep + 1);
    if (bruto[de]?.[para]) {
      const resto = Math.round(((bruto[de][para] || 0) - montoConfirmado) * 100) / 100;
      bruto[de][para] = Math.max(0, resto);
    }
  }

  // Neto por par (un solo sentido: solo queda quien debe neto).
  const pares = [];
  const uids = miembros.map((m) => m.uid);
  for (let i = 0; i < uids.length; i++) {
    for (let j = 0; j < uids.length; j++) {
      if (i === j) continue;
      const a = uids[i];
      const b = uids[j];
      // Redondeo a centavos para no arrastrar ruido de coma flotante.
      const neto = Math.round(((bruto[a]?.[b] || 0) - (bruto[b]?.[a] || 0)) * 100) / 100;
      if (neto > 0.01) {
        pares.push({
          de: a,
          para: b,
          monto: neto,
          deNombre: nombres[a] || a,
          paraNombre: nombres[b] || b,
        });
      }
    }
  }

  // Resumen por miembro.
  const resumen = {};
  for (const m of miembros) {
    const uid = m.uid;
    const debeA = [];
    const leDeben = [];
    let debe = 0;
    let aFavor = 0;
    for (const p of pares) {
      if (p.de === uid) {
        debe += p.monto;
        debeA.push({ uid: p.para, nombre: p.paraNombre, monto: p.monto });
      } else if (p.para === uid) {
        aFavor += p.monto;
        leDeben.push({ uid: p.de, nombre: p.deNombre, monto: p.monto });
      }
    }
    resumen[uid] = {
      uid,
      nombre: m.nombre,
      debe,
      aFavor,
      neto: aFavor - debe,
      debeA,
      leDeben,
    };
  }

  return { pares, resumen };
}