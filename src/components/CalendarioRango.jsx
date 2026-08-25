// components/CalendarioRango.jsx
// Selector de rango de fechas por click (inicio, luego fin), sin dependencias
// externas. Usado por ExpenseForm para acotar el informe de gastos.
//
// Etapa 11 (rediseño): el wrapper .calendario-pared le da la pinta de
// almanaque de pared viejo (dos anillos arriba + encabezado tipo cartel),
// pero el comportamiento de selección de rango es exactamente el mismo.

import { useState } from "react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * @param {object} props
 * @param {Date|null} props.desde
 * @param {Date|null} props.hasta
 * @param {(desde: Date, hasta: Date|null) => void} props.onCambiarRango
 */
export default function CalendarioRango({ desde, hasta, onCambiarRango }) {
  const [mesActual, setMesActual] = useState(desde ?? new Date());

  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < primerDia.getDay(); i += 1) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia += 1) {
    celdas.push(new Date(mesActual.getFullYear(), mesActual.getMonth(), dia));
  }

  function manejarClickDia(fecha) {
    if (!desde || (desde && hasta)) {
      onCambiarRango(fecha, null);
    } else if (fecha < desde) {
      onCambiarRango(fecha, desde);
    } else {
      onCambiarRango(desde, fecha);
    }
  }

  function claseDia(fecha) {
    if (!fecha) return "";
    const t = fecha.getTime();
    if (desde && t === desde.getTime()) return "extremo";
    if (hasta && t === hasta.getTime()) return "extremo";
    if (desde && hasta && t > desde.getTime() && t < hasta.getTime()) return "en-rango";
    return "";
  }

  return (
    <div className="calendario-pared">
      <div className="cal-header">
        <button type="button" onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))}>
          ‹
        </button>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: 0.4 }}>
          {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </strong>
        <button type="button" onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))}>
          ›
        </button>
      </div>
      <div className="cal-grid">
        {DIAS_SEMANA.map((d, i) => (
          <div className="dow" key={`${d}-${i}`}>{d}</div>
        ))}
        {celdas.map((fecha, idx) =>
          fecha ? (
            <button
              type="button"
              key={fecha.toISOString()}
              className={`cal-day ${claseDia(fecha)}`}
              onClick={() => manejarClickDia(fecha)}
            >
              {fecha.getDate()}
            </button>
          ) : (
            <div key={`vacio-${idx}`} />
          )
        )}
      </div>
    </div>
  );
}
