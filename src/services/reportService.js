// services/reportService.js
// Genera informes de DouPiggy:
//   - CSV (Excel) y PDF de los gastos dentro de un rango de fechas, y
//   - PDF del "Estado actual": la liquidación completa (resumen por
//     miembro + matriz de quién le debe a quién + pagos pendientes).
// Trabaja sobre las listas ya suscriptas en el cliente (useExpenses), así
// que funciona incluso sin conexión: filtra lo que ya está en el caché
// local de Firestore.

import { calcularDeudas } from "../utils/calcularDeudas";

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

/** Escapa texto antes de interpolarse en el HTML imprimible (evita XSS). */
function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
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
          <td>${escaparHtml(g.descripcion)}</td>
          <td style="text-align:right;">${formatoMonto(g.monto)}</td>
          <td>${escaparHtml(nombrePorUid[g.pagadoPor] ?? g.pagadoPor)}</td>
          <td>${g.participantes.map((uid) => escaparHtml(nombrePorUid[uid] ?? uid)).join(" / ")}</td>
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

/**
 * Informe del "Estado actual" (PDF imprimible): la liquidación completa del
 * grupo tal como se ve en la pestaña Resumen — resumen por miembro, matriz
 * de quién le debe a quién y la lista de pagos pendientes. No depende de un
 * rango de fechas: refleja el estado presente (los pagos ya recibidos se
 * descuentan si se pasan en pagosConfirmados).
 */
export function generarInformeEstado(gastos, miembros, pagosConfirmados = []) {
  const { pares, resumen } = calcularDeudas(gastos, miembros, pagosConfirmados);
  const formatoMonto = (m) => `$${Number(m || 0).toLocaleString("es-AR")}`;
  const nombre = (m) => escaparHtml(m.nombre || m.uid);

  // Acceso fila → columna: porPar["de\0para"] = monto.
  const porPar = new Map();
  for (const p of pares) porPar.set(`${p.de}\u0000${p.para}`, p.monto);

  const totalGeneral = pares.reduce((acc, p) => acc + p.monto, 0);

  const cabecera = miembros
    .map((m) => `<th>${nombre(m)}</th>`)
    .join("");
  const filas = miembros
    .map((fila) => {
      const celdas = miembros
        .map((col) => {
          if (fila.uid === col.uid) return `<td class="diag">·</td>`;
          const monto = porPar.get(`${fila.uid}\u0000${col.uid}`) || 0;
          return monto > 0.01
            ? `<td class="deuda">${formatoMonto(monto)}</td>`
            : `<td class="cero">–</td>`;
        })
        .join("");
      const saldo = resumen[fila.uid].neto;
      return `<tr>
        <td class="nombre">${nombre(fila)}</td>
        ${celdas}
        <td class="total-fila">${formatoMonto(resumen[fila.uid].debe)}</td>
        <td class="${saldo > 0.01 ? "pos" : saldo < -0.01 ? "neg" : "cero"}">
          ${saldo > 0.01 ? `+${formatoMonto(saldo)}` : saldo < -0.01 ? `-${formatoMonto(-saldo)}` : "–"}
        </td>
      </tr>`;
    })
    .join("");

  const filaDeTotales = `<tr class="totales">
    <td>Le deben</td>
    ${miembros.map((m) => `<td>${formatoMonto(resumen[m.uid].aFavor)}</td>`).join("")}
    <td>${formatoMonto(totalGeneral)}</td>
    <td>= 0</td>
  </tr>`;

  const pagos = pares.length
    ? `<table class="resumen">
         <thead><tr><th>Quién paga</th><th>Monto</th><th>A quién</th></tr></thead>
         <tbody>
           ${pares
             .map(
               (p) => `<tr>
                 <td>${escaparHtml(p.deNombre)}</td>
                 <td class="monto">${formatoMonto(p.monto)}</td>
                 <td>${escaparHtml(p.paraNombre)}</td>
               </tr>`
             )
             .join("")}
         </tbody>
       </table>`
    : "";

  const chips = miembros
    .map((m) => {
      const saldo = resumen[m.uid].neto;
      const txt =
        saldo > 0.01
          ? `Le deben ${formatoMonto(saldo)}`
          : saldo < -0.01
            ? `Debe ${formatoMonto(-saldo)}`
            : "Saldado";
      return `<span class="chip ${saldo > 0.01 ? "pos" : saldo < -0.01 ? "neg" : ""}"><strong>${nombre(m)}</strong>: ${txt}</span>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Estado actual · DouPiggy</title>
      <style>
        body { font-family: sans-serif; color: #3A2317; padding: 24px; }
        h1 { margin-bottom: 0; }
        p.subtitulo { color: #DD5A26; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #3A2317; padding: 6px 8px; font-size: 13px; text-align: center; }
        th { background: #F4C43D; }
        td.nombre { font-weight: 700; text-align: left; }
        td.deuda { color: #C1442D; font-weight: 700; background: #FFF3EC; }
        td.cero { color: #A89B8B; }
        .totales td { font-weight: 700; background: #FFF6E5; }
        .resumen { margin-top: 18px; }
        .resumen td.monto { font-weight: 700; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .chip { border: 1.5px solid #3A2317; border-radius: 999px; padding: 6px 10px; font-size: 12px; }
        .chip.pos { color: #5C7A3D; border-color: #5C7A3D; }
        .chip.neg { color: #C1442D; border-color: #C1442D; }
      </style>
    </head>
    <body>
      <h1>DouPiggy</h1>
      <p class="subtitulo">Estado actual de las cuentas · ${new Date().toLocaleDateString("es-AR")}</p>

      <h3>Resumen del grupo</h3>
      <div class="chips">${chips || "Sin miembros"}</div>

      <h3>Quién le debe a quién</h3>
      <table>
        <thead>
          <tr><th>Integrante</th>${cabecera}<th>Debe</th><th>Saldo</th></tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>${filaDeTotales}</tfoot>
      </table>

      ${pares.length ? `<h3>Pagos pendientes</h3>${pagos}` : `<p>Todo saldado: sin pagos pendientes.</p>`}

      <script>window.onload = () => window.print();</script>
    </body>
    </html>`;

  const ventana = window.open("", "_blank");
  if (!ventana) {
    throw new Error("El navegador bloqueó la ventana de impresión. Habilitá los pop-ups para generar el PDF.");
  }
  ventana.document.write(html);
  ventana.document.close();

  return pares.length;
}
