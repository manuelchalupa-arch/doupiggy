// components/HomeSummary.jsx
// Pestaña Inicio: saldo neto, escena "tira y afloje" con dos cerditos, y
// mini-resumen. El fondo (uno de los 5 escenarios) lo aplica FondoEscena desde
// AppShell; este componente solo dibuja el contenido que flota encima.
//
// La escena es TugOfWarScene (ver src/components/TugOfWar/): elementos
// independientes (PigLeft, Soga, BalanceMarker, PigRight). La posición del
// marcador la da calcularPosicionBalance (proporcional al saldo real, no a 5
// zonas) y la escena la anima sobre la trayectoria SVG.
//
// Cerditos frente a frente, tironeando de la misma soga:
//   - Cerdito 1 (rico, arrogante) → IZQUIERDA
//   - Cerdito 2 (humilde, alegre) → DERECHA
// El marcador se va hacia la izquierda (hacia el cerdito rico) cuando el
// saldo es positivo (le deben) y hacia la derecha cuando es negativo (debe).

import { useMemo } from "react";
import { formatoARS } from "../utils/format";
import { calcularSaldoUsuario, calcularNivel } from "../utils/nivelSaldo";
import { calcularPosicionBalance } from "../utils/calcularPosicionBalance";
import Chanchito from "./Chanchito";
import TugOfWarScene from "./TugOfWar/TugOfWarScene";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 * @param {Array} [props.pagos] - pagos confirmados como recibidos
 */
export default function HomeSummary({ uidActual, miembros, gastos, pagos = [] }) {
  const saldo = useMemo(
    () => calcularSaldoUsuario(gastos, uidActual, pagos),
    [gastos, uidActual, pagos]
  );
  const nivel = useMemo(() => calcularNivel(saldo), [saldo]);

  // Posición del marcador conectada con los MONTOS REALES (0..1, 0.5=equilibrio).
  const posicion = useMemo(
    () => calcularPosicionBalance(gastos, uidActual),
    [gastos, uidActual]
  );

  const totalGastado = useMemo(
    () => gastos.reduce((a, g) => a + g.monto, 0),
    [gastos]
  );

  const { texto, sub } = useMemo(() => {
    if (nivel === "le-deben-mucho")
      return { texto: "¡Te deben un montón!", sub: "Sos el rey de la finanza" };
    if (nivel === "le-deben")
      return { texto: "Te deben plata", sub: "Estás en números azules" };
    if (nivel === "muy-debe")
      return { texto: "¡Debés un montón!", sub: "Hay que ajustar el cinturón" };
    if (nivel === "debe")
      return { texto: "Debés plata", sub: "Falta equilibrar un poco" };
    return { texto: "Estamos a mano", sub: "Ni debe ni le deben" };
  }, [nivel]);

  return (
    <div className="inicio-contenido">
      <div className="tarjeta-flotante" style={{ textAlign: "center", marginTop: -70 }}>
        <p className="estado-etiqueta">{texto}</p>
        <p className="estado-monto">{formatoARS.format(Math.abs(saldo))}</p>
        <p className="estado-subtitulo">{sub}</p>
      </div>

      {/* Escena "tira y afloje": elementos independientes sobre un SVG con
          viewBox lógico (ver src/components/TugOfWar/). La posición del
          marcador proviene de calcularPosicionBalance, que usa los montos
          reales (0..1, 0.5 = equilibrio). */}
      <TugOfWarScene posicion={posicion} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div className="tarjeta-flotante" style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Total gastado</p>
          <p style={{ margin: "2px 0 0", fontFamily: "var(--font-mono)", fontSize: 18 }}>
            {formatoARS.format(totalGastado)}
          </p>
        </div>
        <div className="tarjeta-flotante" style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Miembros</p>
          <p style={{ margin: "2px 0 0", fontFamily: "var(--font-mono)", fontSize: 18 }}>
            {miembros.length}
          </p>
        </div>
      </div>

      <Chanchito nivel={nivel} />
    </div>
  );
}
