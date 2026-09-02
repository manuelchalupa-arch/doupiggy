// components/HomeSummary.jsx
// Pestaña Inicio: saldo neto y mini-resumen. El fondo (uno de los 5
// escenarios) lo aplica FondoEscena desde AppShell; este componente solo
// dibuja el contenido que flota encima, incluyendo la escena "tira y
// afloje" con los dos cerditos (sprites completos en src/components/TugOfWar/).

import { useMemo } from "react";
import { formatoARS } from "../utils/format";
import { calcularSaldoUsuario, calcularNivel } from "../utils/nivelSaldo";
import { calcularPosicionBalance } from "../utils/calcularPosicionBalance";
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

  // Posición del marcador conectada con los montos reales (0..1, 0.5=equilibrio).
  // Incluye los pagos confirmados para que la soga NO contradiga el número
  // de saldo que se muestra al lado.
  const posicion = useMemo(
    () => calcularPosicionBalance(gastos, uidActual, pagos),
    [gastos, uidActual, pagos]
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
      <div className="tarjeta-flotante inicio-estado">
        <p className="estado-etiqueta">{texto}</p>
        <p className="estado-monto">{formatoARS.format(Math.abs(saldo))}</p>
        <p className="estado-subtitulo">{sub}</p>

        <div className="inicio-estadisticas">
          <div className="inicio-estadistica">
            <p className="estadistica-valor">{formatoARS.format(totalGastado)}</p>
            <p className="estadistica-etiqueta">Total gastado</p>
          </div>
          <div className="inicio-estadistica">
            <p className="estadistica-valor">{miembros.length}</p>
            <p className="estadistica-etiqueta">Miembros</p>
          </div>
        </div>
      </div>

      {/* Escena "tira y afloje": dos cerditos sprites tironando la soga. La
          posición del marcador proviene de calcularPosicionBalance (montos
          reales, 0..1; 0.5 = equilibrio). Queda centrada y baja, apoyada
          sobre la botonera de pestañas. */}
      <TugOfWarScene posicion={posicion} />
    </div>
  );
}
