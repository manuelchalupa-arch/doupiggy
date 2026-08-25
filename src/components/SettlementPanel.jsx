// components/SettlementPanel.jsx
// Vista minimalista: solo participantes y saldos pendientes entre ellos
// (quién le paga a quién). Sin encabezados, sin párrafos explicativos, sin
// tarjeta contenedora — el fondo de la app queda visible a pantalla completa.
//
// Etapa 6 (rediseño): cada transacción ahora se lee de arriba a abajo como
// pedía el brief — chanchito que debe, flecha, monto, flecha, chanchito
// que cobra — usando el sistema reutilizable <Chanchito /> (etapa 8) en
// vez de un dibujo nuevo. calcularLiquidacion no se tocó: sólo cambió
// cómo se muestra cada resultado.

import { useMemo } from "react";
import { calcularLiquidacion } from "../services/settlementService";
import { formatoARS } from "../utils/format";
import Chanchito from "./Chanchito";

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
        <Chanchito personaje="girl" estado="celebrate" size={90} />
        <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginLeft: 12 }}>
          Todo saldado
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
      {transacciones.map((t, idx) => (
        <div className="tarjeta-liquidacion" key={`${t.de}-${t.para}-${idx}`}>
          {/* El chanchito no representa a una persona puntual, sino el rol
              (debe / cobra): son los mismos dos personajes de siempre. */}
          <div className="chanchito-nombre">
            <Chanchito personaje="boy" estado="sad" size={44} />
            <span>{nombrePorUid[t.de] ?? t.de}</span>
          </div>
          <FlechaLiquidacion />
          <span className="monto-liquidacion">{formatoARS.format(t.monto)}</span>
          <FlechaLiquidacion />
          <div className="chanchito-nombre">
            <Chanchito personaje="girl" estado="happy" size={44} />
            <span>{nombrePorUid[t.para] ?? t.para}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlechaLiquidacion() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 3 V18 M6 13 L12 19 L18 13" fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


