// components/IconosRaster.jsx
// Íconos funcionales reemplazando los PNG de trash, calendar, pdf y excel.
// Estilo rubber-hose 1930s: trazo grueso, formas redondeadas, sin ángulos
// perfectos, como dibujados a mano con pincel y tinta.
//
// Todos usan viewBox="0 0 40 40" para ser consistentes con IconoTab.jsx
// y se renderizan a 16px dentro de botones (ajustable vía props).

const STROKE = {
  grueso: { strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" },
  medio: { strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
  fino: { strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" },
};

/**
 * Tacho de basura estilo cartoon.
 * Cuerpo bulboso, tapa con "orejas" redondas, líneas verticales onduladas.
 */
export function IconoTrash({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Tapa con orejas redondas */}
      <path
        d="M12 10 Q10 6 14 6 H26 Q30 6 28 10"
        {...STROKE.grueso}
      />
      {/* Asa de la tapa */}
      <path
        d="M17 6 Q20 2 23 6"
        {...STROKE.medio}
      />
      {/* Cuerpo del tacho: ligeramente más ancho abajo */}
      <path
        d="M10 12 L12 34 Q13 36 15 36 H25 Q27 36 28 34 L30 12"
        {...STROKE.grueso}
      />
      {/* Líneas verticales onduladas (como tablones de madera) */}
      <path d="M16 15 Q15.5 24 16 32" {...STROKE.fino} />
      <path d="M20 15 Q20.5 24 20 32" {...STROKE.fino} />
      <path d="M24 15 Q23.5 24 24 32" {...STROKE.fino} />
      {/* Cruz de advertencia estilo rubber-hose */}
      <path d="M8 12 H32" {...STROKE.grueso} />
    </svg>
  );
}

/**
 * Calendario de pared antiguo con hojas arrancables.
 * Anillos de espiral arriba, cuadrícula bulbosa, esquina doblada.
 */
export function IconoCalendar({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Anillos de la espiral (como un calendario de pared vintage) */}
      <path d="M12 6 Q12 2 14 2 Q16 2 16 6" {...STROKE.medio} />
      <path d="M20 6 Q20 2 22 2 Q24 2 24 6" {...STROKE.medio} />
      <path d="M28 6 Q28 2 30 2 Q32 2 32 6" {...STROKE.medio} />
      {/* Marco principal con esquina inferior derecha doblada */}
      <path
        d="M8 10 H32 Q34 10 34 12 V30 Q34 32 32 32 H26 L22 36 V32 H12 Q10 32 10 30 V12 Q10 10 12 10 Z"
        {...STROKE.grueso}
      />
      {/* Línea separadora mes/días */}
      <path d="M10 18 H34" {...STROKE.medio} />
      {/* Días como puntos/burbujas (estilo cartoon) */}
      <circle cx="15" cy="24" r="1.6" fill={color} stroke="none" />
      <circle cx="22" cy="24" r="1.6" fill={color} stroke="none" />
      <circle cx="29" cy="24" r="1.6" fill={color} stroke="none" />
      <circle cx="15" cy="29" r="1.6" fill={color} stroke="none" />
      <circle cx="22" cy="29" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

/**
 * Documento PDF estilo carta antigua.
 * Hoja con esquina doblada, sello circular con "P", líneas de texto.
 */
export function IconoPdf({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Hoja de papel con esquina superior derecha doblada */}
      <path
        d="M8 6 H26 L32 12 V34 Q32 36 30 36 H12 Q10 36 10 34 V8 Q10 6 12 6 Z"
        {...STROKE.grueso}
      />
      {/* Doblez de la esquina */}
      <path d="M26 6 V12 H32" {...STROKE.medio} />
      {/* Líneas de texto (irregulares, como escritas a mano) */}
      <path d="M14 18 H22" {...STROKE.fino} />
      <path d="M14 22 H26" {...STROKE.fino} />
      <path d="M14 26 H20" {...STROKE.fino} />
      {/* Sello circular con "P" */}
      <circle cx="26" cy="28" r="5" {...STROKE.medio} />
      <path d="M24 26 V30 M24 26 H26.5 Q28 26 28 27.5 Q28 29 26.5 29 H24" {...STROKE.fino} />
    </svg>
  );
}

/**
 * Hoja de cálculo / Excel estilo libreta contable.
 * Cuadrícula ondulada, esquina doblada, marca de verificación.
 */
export function IconoExcel({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Marco de la libreta */}
      <path
        d="M8 6 H30 Q32 6 32 8 V32 Q32 34 30 34 H12 Q10 34 10 32 V8 Q10 6 12 6 Z"
        {...STROKE.grueso}
      />
      {/* Líneas verticales de la cuadrícula (ligeramente onduladas) */}
      <path d="M16 6 V34" {...STROKE.fino} />
      <path d="M24 6 V34" {...STROKE.fino} />
      {/* Líneas horizontales */}
      <path d="M10 14 H32" {...STROKE.fino} />
      <path d="M10 22 H32" {...STROKE.fino} />
      <path d="M10 30 H32" {...STROKE.fino} />
      {/* Marca de verificación grande en una celda (estilo sello) */}
      <path
        d="M18 18 L20.5 21.5 L26 15"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
