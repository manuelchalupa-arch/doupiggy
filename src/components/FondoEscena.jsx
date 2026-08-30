// components/FondoEscena.jsx
// Envoltorio compartido: aplica el fondo ilustrado (uno de los 5
// escenarios ya existentes, elegido según el saldo) a pantalla completa
// detrás del contenido de CUALQUIER pestaña — Inicio, Gastos, Resumen, Liquidación
// y Cuenta. Antes esta lógica vivía sólo dentro de HomeSummary y se
// recortaba dentro de una tarjeta con borde; ahora es un único componente
// reutilizado por las 5 pestañas (AppShell decide el nivel una sola vez),
// y el fondo cubre toda el área visible sin bordes ni recortes.

import { backgroundAssets } from "../assets";

/**
 * @param {object} props
 * @param {string} props.nivel - una de las 5 claves de backgroundAssets.nivel
 * @param {import("react").ReactNode} props.children
 */
export default function FondoEscena({ nivel, children }) {
  const fondo = backgroundAssets.nivel[nivel];
  return (
    <div className="fondo-escena" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="fondo-escena-contenido">{children}</div>
    </div>
  );
}
