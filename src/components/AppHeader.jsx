// components/AppHeader.jsx
// Header persistente con forma de "cartel/cartelera" de cartoon (borde
// grueso de tinta + dos "clavos" redondos arriba, como un letrero
// colgado). Por pedido explícito: sin texto ni logo — es solo el marco,
// un lugar reservado para que más adelante se le agregue una imagen.
// No es position:fixed: vive dentro del flujo de <main>, así nunca
// compite con la burbuja de día/noche (que sólo aparece en Cuenta).

export default function AppHeader() {
  return <header className="cartel-header" aria-hidden="true" />;
}
