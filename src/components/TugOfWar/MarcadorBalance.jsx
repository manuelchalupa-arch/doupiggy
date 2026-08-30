// components/TugOfWar/MarcadorBalance.jsx
// Marcador central de la soga. Es un elemento gráfico INDEPENDIENTE: su diseño
// puede reemplazarse por un PNG/SVG/otro recurso cambiando SOLO la entrada
// MARCADOR.recurso en configuracion.js — la lógica de movimiento no cambia.
//
// El <g> exterior recibe `ref` para que la escena lo posicione sobre la
// trayectoria cada cuadro (solo transform, sin re-render). El punto de anclaje
// (MARCADOR.anclajeX/anclajeY) determina qué parte del dibujo queda sobre la
// soga.
//
// Mientras no exista un recurso definitivo se dibuja un placeholder simple,
// marcado explícitamente con data-placeholder para localizarlo fácilmente.

import { forwardRef } from "react";
import { MARCADOR } from "./configuracion";

const MarcadorBalance = forwardRef(function MarcadorBalance(props, ref) {
  const { recurso, ancho, alto, anclajeX, anclajeY, placeholder } = MARCADOR;

  return (
    <g ref={ref} className="marcador-balance">
      <g transform={`translate(${(-ancho * anclajeX).toFixed(2)} ${(-alto * anclajeY).toFixed(2)})`}>
        {recurso ? (
          <image
            href={recurso}
            x={0}
            y={0}
            width={ancho}
            height={alto}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <g data-placeholder="marcador">
            <title>Marcador temporal (reemplazar con el recurso final)</title>
            <circle
              r={placeholder.radio}
              fill={placeholder.relleno}
              stroke={placeholder.borde}
              strokeWidth={3}
            />
          </g>
        )}
      </g>
    </g>
  );
});

export default MarcadorBalance;