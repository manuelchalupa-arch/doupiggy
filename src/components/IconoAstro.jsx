// components/IconoAstro.jsx
// Sol brillante (día) y luna sonriente con estrellas (noche), en el mismo
// estilo "rubber-hose" de trazo grueso que el resto de la app.

export function IconoSol({ tamano = 24 }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano}>
      <g stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round">
        <line x1="20" y1="2" x2="20" y2="9" />
        <line x1="20" y1="31" x2="20" y2="38" />
        <line x1="2" y1="20" x2="9" y2="20" />
        <line x1="31" y1="20" x2="38" y2="20" />
        <line x1="7" y1="7" x2="12" y2="12" />
        <line x1="28" y1="28" x2="33" y2="33" />
        <line x1="33" y1="7" x2="28" y2="12" />
        <line x1="12" y1="28" x2="7" y2="33" />
      </g>
      <circle cx="20" cy="20" r="11" fill="var(--gold)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="16.5" cy="18" r="1.6" fill="var(--ink)" />
      <circle cx="23.5" cy="18" r="1.6" fill="var(--ink)" />
      <path d="M15 23 Q20 27 25 23" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconoLuna({ tamano = 24 }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano}>
      <circle cx="30" cy="9" r="1.4" fill="var(--astro)" />
      <circle cx="34" cy="16" r="1" fill="var(--astro)" />
      <circle cx="6" cy="28" r="1.2" fill="var(--astro)" />
      <path
        d="M25 4 A15 15 0 1 0 25 36 A12 12 0 0 1 25 4 Z"
        fill="var(--astro)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="18" r="1.5" fill="var(--ink)" />
      <circle cx="23" cy="16" r="1.5" fill="var(--ink)" />
      <path d="M15 23 Q20 27 24 22" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
