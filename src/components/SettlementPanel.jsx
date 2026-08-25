// components/SettlementPanel.jsx
// Pestaña Liquidación: muestra quién le debe a quién y cuánto.
//
// Rediseño: dos cerditos varones
//   - Cerdito 1 (rico, arrogante) = acreedor (cobra)
//   - Cerdito 2 (humilde, alegre) = deudor (debe)

import { useMemo } from "react";
import { spriteAssets } from "../assets";
import { formatoARS } from "../utils/format";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 */
export default function SettlementPanel({ uidActual, miembros, gastos }) {
  const transacciones = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;

    const deudas = {};
    for (const g of gastos) {
      const partes = g.participantes?.length || 1;
      const cadaUno = g.monto / partes;
      for (const p of g.participantes || []) {
        if (p !== g.pagadoPor) {
          deudas[p] = (deudas[p] || 0) + cadaUno;
        }
      }
      deudas[g.pagadoPor] = (deudas[g.pagadoPor] || 0) - g.monto + cadaUno;
    }

    const deudores = [];
    const acreedores = [];
    for (const [uid, saldo] of Object.entries(deudas)) {
      if (saldo < -0.01) deudores.push({ uid, nombre: mapa[uid] || uid, monto: -saldo });
      else if (saldo > 0.01) acreedores.push({ uid, nombre: mapa[uid] || uid, monto: saldo });
    }

    const txs = [];
    while (deudores.length && acreedores.length) {
      const d = deudores[0];
      const a = acreedores[0];
      const monto = Math.min(d.monto, a.monto);
      txs.push({ de: d.uid, para: a.uid, monto, deNombre: d.nombre, paraNombre: a.nombre });
      d.monto -= monto;
      a.monto -= monto;
      if (d.monto < 0.01) deudores.shift();
      if (a.monto < 0.01) acreedores.shift();
    }
    return txs;
  }, [gastos, miembros]);

  return (
    <div className="tarjeta">
      <span className="etiqueta">Liquidación</span>
      <h2>¿Quién le debe a quién?</h2>

      {transacciones.length === 0 && (
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          ¡Todo saldado! No hay deudas pendientes.
        </p>
      )}

      {transacciones.map((t, i) => (
        <div
          key={i}
          className="tarjeta-liquidacion"
          style={{ marginBottom: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Deudor: Cerdito 2 (humilde, alegre) triste */}
            <div className="chanchito-nombre">
              <img
                src={spriteAssets.cerdito2}
                alt="Deudor"
                style={{ width: 40, height: 40, objectFit: "contain" }}
              />
              <span>{t.deNombre}</span>
            </div>

            <FlechaLiquidacion />

            <div
              className="monto-liquidacion"
              style={{ fontFamily: "var(--font-mono)", fontSize: 20 }}
            >
              {formatoARS.format(t.monto)}
            </div>

            <FlechaLiquidacion />

            {/* Acreedor: Cerdito 1 (rico, arrogante) feliz */}
            <div className="chanchito-nombre">
              <img
                src={spriteAssets.cerdito1}
                alt="Acreedor"
                style={{ width: 40, height: 40, objectFit: "contain" }}
              />
              <span>{t.paraNombre}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Flecha de liquidación (SVG inline). */
function FlechaLiquidacion() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flex: "none", opacity: 0.6 }}>
      <path
        d="M4 10 H16 M12 6 L16 10 L12 14"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
