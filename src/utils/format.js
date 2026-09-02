// Formateador de importes en pesos argentinos.
export const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Convierte texto de monto a número, soportando el formato argentino:
 * `.` como separador de miles y `,` como separador decimal (p. ej. "1.500,50"
 * → 1500.5). Devuelve NaN si no es un número válido.
 */
export function parsePeso(texto) {
  const limpio = String(texto ?? "")
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : NaN;
}
