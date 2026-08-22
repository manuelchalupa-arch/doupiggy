// services/reportService.js
// Genera un informe (CSV) de los gastos de un grupo dentro de un rango de
// fechas. Trabaja sobre la lista de gastos ya suscripta en el cliente
// (useExpenses), así que funciona incluso sin conexión: filtra lo que ya
// está en el caché local de Firestore.

/**
 * @param {Array} gastos - gastos del grupo, cada uno con `creadoEn` (Timestamp de Firestore)
 * @param {Date} desde
 * @param {Date} hasta
 */
export function filtrarGastosPorRango(gastos, desde, hasta) {
  const inicio = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()).getTime();
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59).getTime();

  return gastos.filter((g) => {
    const fecha = g.creadoEn?.toDate ? g.creadoEn.toDate().getTime() : null;
    if (fecha === null) return false;
    return fecha >= inicio && fecha <= fin;
  });
}

function escaparCeldaCsv(valor) {
  const texto = String(valor ?? "");
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Arma el contenido CSV (string) de un listado de gastos, con nombres de
 * persona en vez de uids.
 */
export function generarCsvGastos(gastos, nombrePorUid) {
  const encabezado = ["Fecha", "Descripción", "Monto", "Pagó", "Participantes"];
  const filas = gastos.map((g) => [
    g.creadoEn?.toDate ? g.creadoEn.toDate().toLocaleDateString("es-AR") : "",
    g.descripcion,
    g.monto,
    nombrePorUid[g.pagadoPor] ?? g.pagadoPor,
    g.participantes.map((uid) => nombrePorUid[uid] ?? uid).join(" / "),
  ]);

  return [encabezado, ...filas]
    .map((fila) => fila.map(escaparCeldaCsv).join(","))
    .join("\n");
}

/** Dispara la descarga de un archivo CSV en el navegador. */
export function descargarCsv(contenido, nombreArchivo = "informe-gastos.csv") {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/**
 * Función de conveniencia: filtra, arma el CSV y lo descarga en un solo paso.
 * Pensado para el botón con ícono de Excel (un .csv se abre nativamente ahí).
 */
export function generarInformeExcel(gastos, nombrePorUid, desde, hasta) {
  const filtrados = filtrarGastosPorRango(gastos, desde, hasta);
  const csv = generarCsvGastos(filtrados, nombrePorUid);
  const nombreArchivo = `informe-doupiggy_${desde.toISOString().slice(0, 10)}_a_${hasta
    .toISOString()
    .slice(0, 10)}.csv`;
  descargarCsv(csv, nombreArchivo);
  return filtrados.length;
}

// Alias retrocompatible: el nombre anterior de la función.
export const generarInforme = generarInformeExcel;

/**
 * Genera un informe en PDF sin depender de ninguna librería externa: arma
 * una vista imprimible en una ventana nueva y dispara el diálogo de
 * impresión del navegador, donde el usuario elige "Guardar como PDF".
 * Pensado para el botón con ícono de PDF.
 */
export function generarInformePdf(gastos, nombrePorUid, desde, hasta) {
  const filtrados = filtrarGastosPorRango(gastos, desde, hasta);
  const formatoFecha = (d) => d.toLocaleDateString("es-AR");
  const formatoMonto = (m) => `$${Number(m).toLocaleString("es-AR")}`;

  const filas = filtrados
    .map(
      (g) => `
        <tr>
          <td>${g.creadoEn?.toDate ? formatoFecha(g.creadoEn.toDate()) : ""}</td>
          <td>${g.descripcion}</td>
          <td style="text-align:right;">${formatoMonto(g.monto)}</td>
          <td>${nombrePorUid[g.pagadoPor] ?? g.pagadoPor}</td>
          <td>${g.participantes.map((uid) => nombrePorUid[uid] ?? uid).join(" / ")}</td>
        </tr>`
    )
    .join("");

  const total = filtrados.reduce((acc, g) => acc + g.monto, 0);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Informe DouPiggy</title>
      <style>
        body { font-family: sans-serif; color: #3A2317; padding: 24px; }
        h1 { margin-bottom: 0; }
        p.subtitulo { color: #DD5A26; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #3A2317; padding: 6px 8px; font-size: 13px; text-align: left; }
        th { background: #F4C43D; }
        tfoot td { font-weight: 700; background: #FFF6E5; }
      </style>
    </head>
    <body>
      <h1>DouPiggy</h1>
      <p class="subtitulo">Informe de gastos del ${formatoFecha(desde)} al ${formatoFecha(hasta)}</p>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Pagó</th><th>Participantes</th></tr>
        </thead>
        <tbody>${filas || `<tr><td colspan="5">Sin gastos en este rango.</td></tr>`}</tbody>
        <tfoot>
          <tr><td colspan="2">Total</td><td style="text-align:right;">${formatoMonto(total)}</td><td colspan="2"></td></tr>
        </tfoot>
      </table>
      <script>window.onload = () => window.print();</script>
    </body>
    </html>`;

  const ventana = window.open("", "_blank");
  if (!ventana) {
    throw new Error("El navegador bloqueó la ventana de impresión. Habilitá los pop-ups para generar el PDF.");
  }
  ventana.document.write(html);
  ventana.document.close();

  return filtrados.length;
}
