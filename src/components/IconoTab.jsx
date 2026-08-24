// components/IconosTab.jsx
// Los 4 íconos de la barra de pestañas comparten un mismo lenguaje visual:
// un "medallón" circular (anillo de tinta + anillo dorado interior, como
// una moneda o botón de cartel de los años 30) con un pictograma grueso
// adentro. La unificación viene del marco compartido, no de repetir el
// mismo dibujo.

function Medallon({ children }) {
  return (
    <svg viewBox="0 0 40 40" width="26" height="26">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="var(--gold)" strokeWidth="1.6" />
      {children}
    </svg>
  );
}

export function IconoTabInicio() {
  return (
    <Medallon>
      <path
        d="M11 20 L20 12 L29 20 M13.5 18.5 V27 H26.5 V18.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17.5 27 V22 H22.5 V27" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </Medallon>
  );
}

export function IconoTabGastos() {
  return (
    <Medallon>
      <circle cx="20" cy="21" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M20 17 V25 M17.5 19 Q20 17.5 22.5 19 M17.5 23 Q20 24.5 22.5 23" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 12 Q20 9 26 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Medallon>
  );
}

export function IconoTabLiquidacion() {
  return (
    <Medallon>
      <line x1="20" y1="11" x2="20" y2="28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="12" y1="15" x2="28" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 15 L9 20.5 A3.2 3.2 0 0 0 15 20.5 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M28 15 L25 20.5 A3.2 3.2 0 0 0 31 20.5 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.5 28 H23.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Medallon>
  );
}

export function IconoTabInfo() {
  return (
    <Medallon>
      {/* guante rubber-hose con el índice levantado: motivo clásico de los años 30 */}
      <path
        d="M18 26 V17.5 A2 2 0 0 1 22 17.5 V22 M18 22 V19.3 A1.7 1.7 0 0 1 21.4 19.3 M18 26 H24 A3 3 0 0 0 27 23 V21 A1.6 1.6 0 0 0 23.8 21 M18 26 H15.5 A2 2 0 0 1 13.5 24 V22.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Medallon>
  );
}
