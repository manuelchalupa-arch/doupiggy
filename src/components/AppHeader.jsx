// components/AppHeader.jsx
// Header persistente con forma de "cartel/cartelera" de cartoon (borde
// grueso de tinta + dos "clavos" redondos arriba, como un letrero
// colgado). Muestra la marca DuoPiggy a la izquierda y, a la derecha,
// el contexto de la pantalla actual junto con el nombre del grupo.
// No es position:fixed: vive dentro del flujo de <main>, así nunca
// compite con la burbuja de día/noche (que sólo aparece en Cuenta).

import { brandingAssets } from "../assets";

/**
 * @param {object} props
 * @param {string} props.contexto - Nombre de la pantalla actual (ej: "Gastos")
 * @param {string} [props.grupoNombre] - Nombre del grupo activo
 */
export default function AppHeader({ contexto, grupoNombre }) {
  return (
    <header className="cartel-header">
      <div className="cartel-marca">
        <img src={brandingAssets.logo} alt="" />
        <span>DuoPiggy</span>
      </div>
      <div className="cartel-contexto">
        <p className="contexto-titulo">{contexto}</p>
        {grupoNombre && <p className="contexto-grupo">{grupoNombre}</p>}
      </div>
    </header>
  );
}
