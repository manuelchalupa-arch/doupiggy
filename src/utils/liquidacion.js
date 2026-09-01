// src/utils/liquidacion.js
// Vista personal de la pestaña Liquidación, derivada 100% de gastos + pagos
// (nunca se persiste una "deuda": el saldo por par viene de
// calcularDeudas.js y los pagos CONFIRMADOS lo descuentan).
//
// Expone:
//   - calcularPosicionLiquidacion(): lo que debés, lo que te deben, los
//     pendientes de confirmación y la antigüedad de cada deuda (en días,
//     medida desde el gasto más viejo que la originó).
//   - recomendarLiquidacion(): qué deuda conviene pagar primero según la
//     estrategia elegida, con la explicación transparente del motivo.
//   - planificarConMonto(): modo "tengo X para pagar" — combina deudas para
//     eliminar la mayor cantidad posible, priorizar antigüedad o reducir la
//     deuda más grande, sin obligar a ninguna.
//
// Estrategias (una por una; el usuario las ve y puede cambiarlas):
//   - liberarme  → menor monto primero: elimina la mayor cantidad de deudas.
//   - antiguedad → la deuda más vieja primero: menos riesgo de olvidarla.
//   - monto      → la más grande primero: baja el peso más importante.
// El modo "tengo X para pagar" suma una cuarta lectura (combinaciones).

import { calcularDeudas } from "./calcularDeudas";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Edad de una deuda (deudor → acreedor) en días, medida desde el gasto más
 * viejo que la originó (el que el acreedor pagó y el deudor participó).
 * null si no hay gasto con fecha para ese par (nunca debería pasar).
 */
function antiguedadDelPar(gastos, deudor, acreedor, ahoraMs) {
  let masVieja = Infinity;
  let hayDato = false;
  for (const g of gastos) {
    if (g.pagadoPor !== acreedor || !(g.participantes || []).includes(deudor)) continue;
    const ms = g.creadoEn?.toDate ? g.creadoEn.toDate().getTime() : null;
    if (typeof ms !== "number" || Number.isNaN(ms)) continue;
    hayDato = true;
    if (ms < masVieja) masVieja = ms;
  }
  if (!hayDato) return null;
  return Math.max(0, Math.floor((ahoraMs - masVieja) / DIA_MS));
}

/**
 * @param {object} datos
 * @param {Array} datos.gastos
 * @param {Array<{uid:string,nombre:string,alias?:string,cbu?:string}>} datos.miembros
 * @param {Array} datos.pagos - todos los pagos (cualquier estado)
 * @param {string} datos.uidActual
 * @param {number} [datos.ahoraMs]
 */
export function calcularPosicionLiquidacion({ gastos = [], miembros = [], pagos = [], uidActual = null, ahoraMs = Date.now() }) {
  const { pares } = calcularDeudas(gastos, miembros, pagos);

  const infoPorUid = {};
  for (const m of miembros) {
    infoPorUid[m.uid] = { nombre: m.nombre, alias: m.alias ?? null, cbu: m.cbu ?? null };
  }

  const deboA = [];
  const meDeben = [];
  let totalDebo = 0;
  let totalMeDeben = 0;

  for (const p of pares) {
    if (p.de === uidActual) {
      const monto = Math.round(p.monto * 100) / 100;
      deboA.push({
        para: p.para,
        nombre: p.paraNombre,
        monto,
        alias: infoPorUid[p.para]?.alias ?? null,
        cbu: infoPorUid[p.para]?.cbu ?? null,
        antiguedadDias: antiguedadDelPar(gastos, uidActual, p.para, ahoraMs),
      });
      totalDebo += monto;
    } else if (p.para === uidActual) {
      const monto = Math.round(p.monto * 100) / 100;
      meDeben.push({
        de: p.de,
        nombre: p.deNombre,
        monto,
        alias: infoPorUid[p.de]?.alias ?? null,
        cbu: infoPorUid[p.de]?.cbu ?? null,
        antiguedadDias: antiguedadDelPar(gastos, p.de, uidActual, ahoraMs),
      });
      totalMeDeben += monto;
    }
  }

  // Lo que debés: primero lo más antiguo (más urgente), luego el monto.
  deboA.sort((a, b) => (b.antiguedadDias ?? -1) - (a.antiguedadDias ?? -1) || b.monto - a.monto);
  // Lo que te deben: primero lo más grande.
  meDeben.sort((a, b) => b.monto - a.monto);

  // Pendiente de confirmación: declaraciones en vuelo que te involucran.
  const pendientes = (pagos || [])
    .filter((p) => p.estado === "declarado" && (p.de === uidActual || p.para === uidActual))
    .map((p) => ({
      id: p.id,
      de: p.de,
      para: p.para,
      monto: Math.round((p.monto || 0) * 100) / 100,
      sentido: p.de === uidActual ? "declare-yo" : "me-declararon",
      quien: infoPorUid[p.de]?.nombre ?? p.de,
      quienPara: infoPorUid[p.para]?.nombre ?? p.para,
      declaradoEn: p.declaradoEn,
    }))
    .sort((a, b) => (b.declaradoEn?.toMillis?.() ?? 0) - (a.declaradoEn?.toMillis?.() ?? 0));

  const totalPendienteConfirmacion = Math.round(pendientes.reduce((a, p) => a + p.monto, 0) * 100) / 100;

  return {
    deboA,
    meDeben,
    totalDebo: Math.round(totalDebo * 100) / 100,
    totalMeDeben: Math.round(totalMeDeben * 100) / 100,
    pendientes,
    totalPendienteConfirmacion,
  };
}

const ESTRATEGIAS = {
  liberarme: {
    etiqueta: "Liberarme rápido",
    ordenar: (as) => [...as].sort((a, b) => a.monto - b.monto),
    motivo: (d) =>
      d.monto <= 5000
        ? `Es la deuda más chica (${d.antiguedadDias ?? 0} días de antigüedad): eliminarla completa te libera una obligación pendiente rápido.`
        : `Entre tus deudas activas es la que podés saldar por completo con el menor monto, dejando menos obligaciones colgando.`,
  },
  antiguedad: {
    etiqueta: "Más antiguas",
    ordenar: (as) => [...as].sort((a, b) => (b.antiguedadDias ?? 0) - (a.antiguedadDias ?? 0)),
    motivo: (d) =>
      `Es la deuda más vieja (hace ${d.antiguedadDias ?? 0} días): pagarla primero evita que el acuerdo se olvide o se complique.`,
  },
  monto: {
    etiqueta: "Mayor monto",
    ordenar: (as) => [...as].sort((a, b) => b.monto - a.monto),
    motivo: (d) =>
      `Es la deuda más grande: reducirla primero baja el monto que más pesa sobre tu posición.`,
  },
};

/**
 * Recomienda qué deuda pagar primero según la estrategia elegida.
 * No es un puntaje mágico: se elige la primera de la lista ordenada por el
 * criterio explícito y el motivo textual lo cuenta (transparencia total).
 * @param {Array} deboA - salida de calcularPosicionLiquidacion().deboA
 * @param {string} [estrategia] - "liberarme" | "antiguedad" | "monto"
 * @returns {{recomendada: object|null, motivo: string}}
 */
export function recomendarLiquidacion(deboA = [], estrategia = "liberarme") {
  const activas = deboA.filter((d) => d.monto > 0.01);
  if (!activas.length) return { recomendada: null, motivo: "No tenés deudas pendientes: ¡todo saldado!" };
  const regla = ESTRATEGIAS[estrategia] ?? ESTRATEGIAS.liberarme;
  const recomendada = regla.ordenar(activas)[0];
  return { recomendada, motivo: regla.motivo(recomendada) };
}

/**
 * Modo "¿Cuánto dinero tenés disponible para liquidar ahora?".
 * Calcula alternativas (nunca obliga a ninguna) y explica por qué.
 * @param {Array} deudas - deboA de calcularPosicionLiquidacion()
 * @param {number} dinero - monto disponible
 * @returns {Array<{clave:string,titulo:string,items:Array,sobra:number,porque:string}>}
 */
export function planificarConMonto(deudas = [], dinero = 0) {
  const activas = deudas.filter((d) => d.monto > 0.01);
  const tope = Math.round(dinero * 100) / 100;
  if (!activas.length || tope <= 0) return [];

  const elegibles = (lista) => {
    let sobra = tope;
    const elegidas = [];
    for (const d of lista) {
      if (d.monto <= sobra + 0.005) {
        elegidas.push({ ...d, pagado: d.monto });
        sobra = Math.round((sobra - d.monto) * 100) / 100;
      }
    }
    return { elegidas, sobra };
  };

  const menor = (as) => [...as].sort((a, b) => a.monto - b.monto);
  const masAntiguas = (as) => [...as].sort((a, b) => (b.antiguedadDias ?? 0) - (a.antiguedadDias ?? 0));
  const masGrande = (as) => [...as].sort((a, b) => b.monto - a.monto);

  const opciones = [];

  const porMenor = elegibles(menor(activas));
  opciones.push({
    clave: "eliminar",
    titulo: "Eliminar más deudas",
    items: porMenor.elegidas,
    sobra: porMenor.sobra,
    porque:
      porMenor.elegidas.length > 0
        ? `Con $${tope} saldás ${porMenor.elegidas.length} obligación(es) completa(s), dejando la menor cantidad de deudas activas.`
        : `El monto no alcanza para saldar completa ninguna deuda de menor a mayor.`,
  });

  const porAntiguedad = elegibles(masAntiguas(activas));
  opciones.push({
    clave: "antiguedad",
    titulo: "Priorizar antigüedad",
    items: porAntiguedad.elegidas,
    sobra: porAntiguedad.sobra,
    porque:
      porAntiguedad.elegidas.length > 0
        ? `Empezás por las deudas más viejas para que ninguna quede sin resolver.`
        : `Con $${tope} no cubrís completa ni la deuda más antigua.`,
  });

  const grande = masGrande(activas)[0];
  const pagoGrande = Math.round(Math.min(grande.monto, tope) * 100) / 100;
  const esParcial = pagoGrande < grande.monto - 0.005;
  opciones.push({
    clave: "grande",
    titulo: "Reducir la más grande",
    items: [{ ...grande, pagado: pagoGrande, esParcial }],
    sobra: Math.round((tope - pagoGrande) * 100) / 100,
    porque: esParcial
      ? `Le pagás un parcial de $${pagoGrande} a ${grande.nombre}: la deuda no se elimina pero baja de $${grande.monto} a $${Math.round((grande.monto - pagoGrande) * 100) / 100}.`
      : `Saldás por completo la deuda más grande (${grande.nombre}).`,
  });

  return opciones;
}