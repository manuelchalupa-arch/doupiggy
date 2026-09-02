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
//
// Este archivo es la FUENTE ÚNICA del balance del grupo. Tanto
// `calcularDeudas` (Resumen/Liquidación) como `calcularSaldoUsuario`
// (Inicio/escena) consumen el mismo core `calcularBalanceGrupo`, así el
// saldo de Inicio nunca vuelve a divergir del detalle de Resumen.

import { parteDeGasto } from "./division";
import { esPagoConfirmado } from "../services/pagoService";

/**
 * Núcleo único del balance: deuda bruta por par, pagos confirmados aplicados
 * (con piso en 0), neto por par y resumen por miembro. Es la única parte que
 * conoce la matemática de gastos + pagos; el resto del código solo la lee.
 */
export function calcularBalanceGrupo(gastos, miembros, pagosConfirmados = []) {
  const nombres = {};
  const uids = [];
  for (const m of miembros) {
    nombres[m.uid] = m.nombre;
    uids.push(m.uid);
  }

  // Deuda bruta: bruto[deudor][acreedor] = monto que debe "deudor" a "acreedor".
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

  // Pagos CONFIRMADOS por par (de → para) con piso en 0 en la deuda bruta.
  const confirmadoPorPar = {};
  for (const p of pagosConfirmados || []) {
    if (!esPagoConfirmado(p)) continue;
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
  for (let i = 0; i < uids.length; i++) {
    for (let j = 0; j < uids.length; j++) {
      if (i === j) continue;
      const a = uids[i];
      const b = uids[j];
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

  return { uids, bruto, pares, resumen };
}

/**
 * @param {Array<{uid: string, nombre: string}>} miembros
 * @param {Array} gastos - cada gasto con pagadoPor, participantes[], monto y division
 * @param {Array} [pagosConfirmados] - pagos recibidos confirmados, cada uno
 *   { de: uid del que pagó, para: uid que cobró, monto }
 * @returns {{ pares: Array, resumen: Object }}
 */
export function calcularDeudas(gastos, miembros, pagosConfirmados = []) {
  const { pares, resumen } = calcularBalanceGrupo(gastos, miembros, pagosConfirmados);
  return { pares, resumen };
}