// components/HomeSummary.jsx
// Pestaña Inicio: saldo neto y mini-resumen. El fondo (uno de los 5
// escenarios) lo aplica FondoEscena desde AppShell; este componente solo
// dibuja el contenido que flota encima.

import { useMemo } from "react";
import { formatoARS } from "../utils/format";
import { calcularSaldoUsuario, calcularNivel } from "../utils/nivelSaldo";
import Chanchito from "./Chanchito";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 * @param {Array} [props.pagos] - pagos confirmados como recibidos
 * @param {object} [props.perfil] - perfil del usuario (avatar guardado en perfil.foto)
 */
export default function HomeSummary({ uidActual, miembros, gastos, pagos = [], perfil }) {
  const saldo = useMemo(
    () => calcularSaldoUsuario(gastos, uidActual, pagos),
    [gastos, uidActual, pagos]
  );
  const nivel = useMemo(() => calcularNivel(saldo), [saldo]);

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
      <div className="tarjeta-flotante" style={{ textAlign: "center" }}>
        <p className="estado-etiqueta">{texto}</p>
        <p className="estado-monto">{formatoARS.format(Math.abs(saldo))}</p>
        <p className="estado-subtitulo">{sub}</p>
      </div>

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

      <Chanchito nivel={nivel} foto={perfil?.foto} />
    </div>
  );
}
