// components/SettlementPanel.jsx
// Vista minimalista: solo participantes y saldos pendientes entre ellos
// (quién le paga a quién). Sin encabezados, sin párrafos explicativos, sin
// tarjeta contenedora — el fondo de la app queda visible a pantalla completa.

import { useMemo } from "react";
import { calcularLiquidacion } from "../services/settlementService";
import { formatoARS } from "../utils/format";

/**
 * @param {object} props
 * @param {Array} props.gastos
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 */
export default function SettlementPanel({ gastos, miembros }) {
  const nombrePorUid = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return mapa;
  }, [miembros]);

  const { transacciones } = useMemo(() => calcularLiquidacion(gastos), [gastos]);

  if (transacciones.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>Todo saldado</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      {transacciones.map((t, idx) => (
        <div
          key={`${t.de}-${t.para}-${idx}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            background: "var(--paper)",
            border: "3px solid var(--ink)",
            borderRadius: 14,
            padding: "12px 16px",
            boxShadow: "4px 4px 0 var(--ink)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{nombrePorUid[t.de] ?? t.de}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--burnt)" }}>→</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{nombrePorUid[t.para] ?? t.para}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--teal)", marginLeft: "auto" }}>
            {formatoARS.format(t.monto)}
          </span>
        </div>
      ))}
    </div>
  );
}
