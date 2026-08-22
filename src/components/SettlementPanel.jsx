// components/SettlementPanel.jsx
// Misma lógica de liquidación de siempre (settlementService), con la
// identidad visual retro: tarjeta "sticker" + etiquetas de color por signo.

import { useMemo } from "react";
import { calcularLiquidacion } from "../services/settlementService";

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * @param {object} props
 * @param {Array} props.gastos - gastos del grupo (de useExpenses)
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 */
export default function SettlementPanel({ gastos, miembros }) {
  const nombrePorUid = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return mapa;
  }, [miembros]);

  const { saldos, transacciones } = useMemo(
    () => calcularLiquidacion(gastos),
    [gastos]
  );

  return (
    <div className="tarjeta">
      <span className="etiqueta">Liquidación</span>
      <h2>Saldos del grupo</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
        {Object.entries(saldos).map(([uid, saldo]) => (
          <li
            key={uid}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 0",
              borderBottom: "2px dashed var(--ink)",
            }}
          >
            <span>{nombrePorUid[uid] ?? uid}</span>
            <span style={{ color: saldo > 0 ? "var(--teal)" : saldo < 0 ? "var(--burnt)" : "var(--ink)" }}>
              {saldo > 0
                ? `le deben ${formatoARS.format(saldo)}`
                : saldo < 0
                ? `debe ${formatoARS.format(Math.abs(saldo))}`
                : "está al día"}
            </span>
          </li>
        ))}
      </ul>

      <h2>Cómo saldar con menos pagos</h2>
      {transacciones.length === 0 ? (
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          No hay deudas pendientes en este grupo.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {transacciones.map((t, idx) => (
            <li
              key={`${t.de}-${t.para}-${idx}`}
              style={{ fontSize: 13, fontWeight: 600, padding: "4px 0" }}
            >
              {nombrePorUid[t.de] ?? t.de} le paga {formatoARS.format(t.monto)} a{" "}
              {nombrePorUid[t.para] ?? t.para}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
