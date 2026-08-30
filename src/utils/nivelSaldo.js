// utils/nivelSaldo.js
// Traduce el saldo neto del usuario a una de las 5 zonas visuales que ya
// existen como fondos (backgroundAssets.nivel). Antes este cálculo vivía
// duplicado dentro de HomeSummary; ahora vive acá una sola vez porque
// AppShell lo necesita para aplicar el fondo correspondiente en TODAS las
// pestañas, no solo en Inicio.

import { parteDeGasto } from "./division";

export const UMBRAL_NEUTRO = 500;
export const UMBRAL_ALTO = 5000;

/**
 * Saldo neto real del usuario: positivo = le deben, negativo = debe.
 * Los pagosConfirmados son pagos que el acreedor de un par ya cobró: cada
 * uno extingue deuda, así que desciende el saldo de quien cobra (p.para) y
 * asciende el de quien paga (p.de).
 */
export function calcularSaldoUsuario(gastos, uidActual, pagosConfirmados = []) {
  let s = 0;
  for (const g of gastos) {
    const miParte = parteDeGasto(g, uidActual);
    if (g.pagadoPor === uidActual) s += g.monto - miParte;
    else if ((g.participantes || []).includes(uidActual)) s -= miParte;
  }
  for (const p of pagosConfirmados || []) {
    if (p.para === uidActual) s -= p.monto;
    else if (p.de === uidActual) s += p.monto;
  }
  // Redondeo a centavos para evitar arrastre de errores de coma flotante.
  return Math.round(s * 100) / 100;
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
