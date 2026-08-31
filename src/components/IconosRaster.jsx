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
 * Con `prohibido` agrega el símbolo de "no pasar" (círculo + diagonal)
 * detrás, para reusar el mismo concepto en botones de borrar/eliminar.
 */
export function IconoTrash({ tamano = 16, color = "currentColor", prohibido = false }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {prohibido && (
        <>
          {/* Anillo de prohibido */}
          <circle cx="20" cy="20" r="16.5" {...STROKE.fino} />
          {/* Diagonal del prohibido */}
          <path d="M12 28 L28 12" {...STROKE.grueso} />
        </>
      )}
      {/* El tacho ligeramente más chico para que entre dentro del anillo */}
      <g transform={prohibido ? "translate(3.6 5.4) scale(0.82)" : undefined}>
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
      </g>
    </svg>
  );
}

/**
 * Invitación online: una persona con un sobre a su lado (sumá gente al
 * grupo con un enlace). Referencia la idea de Google/WhatsApp: compartir
 * la invitación con otras personas.
 */
export function IconoInvitacion({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Cabeza de la persona */}
      <circle cx="11" cy="11" r="4.5" {...STROKE.grueso} />
      {/* Hombros */}
      <path d="M3 32 Q5 25 8.5 25 H13.5 Q17 25 19 32" {...STROKE.medio} />
      {/* Sobre (invitación) */}
      <path d="M23 20 H36 Q37 20 37 21 V30 Q37 31 36 31 H23 Q22 31 22 30 V21 Q22 20 23 20 Z" {...STROKE.grueso} />
      {/* Solapa del sobre */}
      <path d="M22 21 L29.5 26 L37 21" {...STROKE.medio} />
      {/* Sello del sobre */}
      <circle cx="29.5" cy="26" r="1.3" fill={color} stroke="none" />
    </svg>
  );
}

/**
 * Agregar a alguien "local" (sin cuenta): una persona junto a una casa,
 * = sumar a un miembro a este grupo aunque no use la app.
 */
export function IconoAgregarLocal({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      {/* Persona */}
      <circle cx="11" cy="10" r="4" {...STROKE.grueso} />
      <path d="M4 32 Q6 23 8.5 23 H13.5 Q17 23 19 32" {...STROKE.medio} />
      {/* Casa */}
      <path d="M23 18 L29 10.5 L35 18" {...STROKE.grueso} />
      <path d="M24 17 H34 V32 H24 Z" {...STROKE.medio} />
      {/* Puerta de la casa */}
      <path d="M27.5 31.5 V25.5 H30.5 V31.5" {...STROKE.fino} />
    </svg>
  );
}

/** Un cerdito de frente (orejas, hocico y ojos), estilo rubber-hose. */
function Piglet({ cx, cy, color }) {
  return (
    <g>
      {/* Orejas */}
      <circle cx={cx - 4} cy={cy - 5.5} r="1.7" {...STROKE.fino} />
      <circle cx={cx + 4} cy={cy - 5.5} r="1.7" {...STROKE.fino} />
      {/* Cabeza */}
      <circle cx={cx} cy={cy} r="5" {...STROKE.grueso} />
      {/* Hocico */}
      <ellipse cx={cx} cy={cy + 2.2} rx="3" ry="1.9" {...STROKE.fino} />
      {/* Nariz */}
      <circle cx={cx - 1.1} cy={cy + 2.2} r="0.7" fill={color} stroke="none" />
      <circle cx={cx + 1.1} cy={cy + 2.2} r="0.7" fill={color} stroke="none" />
      {/* Ojos */}
      <circle cx={cx - 1.8} cy={cy - 0.8} r="0.6" fill={color} stroke="none" />
      <circle cx={cx + 1.8} cy={cy - 0.8} r="0.6" fill={color} stroke="none" />
    </g>
  );
}

/**
 * Crear grupo: varios cerditos juntos (una piña). Reutiliza la misma figura
 * de cerdo que los avatares: la marca de la app son los chanchos.
 */
export function IconoCrearGrupo({ tamano = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 40 40" width={tamano} height={tamano} fill="none" stroke={color}>
      <Piglet cx={10} cy={18} color={color} />
      <Piglet cx={20} cy={13} color={color} />
      <Piglet cx={30} cy={18} color={color} />
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
