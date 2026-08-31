// components/TugOfWar/SogaTugOfWar.jsx
// Capa visual de la soga, INDEPENDIENTE de los personajes y del marcador.
//
// La trayectoria matemática (SOGA.d) es un <path> al que la escena consulta
// con getPointAtLength() para mover el marcador. La apariencia va encima de
// ese mismo recorrido en varias capas finas de trazo (paleta de la app) y
// puede reemplazarse sin tocar la lógica de movimiento:
//   - silueta exterior oscura + borde interior
//   - cuerpo con segmentos alternos (trenzado) usando strokeDasharray
//   - fina línea central clara
//
// El primer <path> (que además es la trayectoria) lleva el ref que usa la
// escena para leer puntos con getPointAtLength().

import { forwardRef } from "react";
import { SOGA } from "./configuracion";

const SogaTugOfWar = forwardRef(function SogaTugOfWar(props, pathRef) {
  const { d } = SOGA;
  const trazo = { fill: "none", strokeLinecap: "round" };

  return (
    <g className="soga-tugofwar">
      {/* Silueta exterior (también es la "trayectoria" del marcador) */}
      <path
        ref={pathRef}
        id="trayectoria-soga"
        d={d}
        style={trazo}
        stroke={SOGA.colorSilueta}
        strokeWidth={SOGA.grosor}
      />
      {/* Borde interior */}
      <path d={d} style={trazo} stroke={SOGA.colorBorde} strokeWidth={SOGA.grosorBorde} />
      {/* Cuerpo */}
      <path d={d} style={trazo} stroke={SOGA.colorCuerpo} strokeWidth={SOGA.grosorCuerpo} />
      {/* Segmentos alternos del trenzado */}
      <path
        d={d}
        style={trazo}
        stroke={SOGA.colorSegmento}
        strokeWidth={SOGA.grosorCuerpo}
        strokeDasharray={SOGA.segmentoTrenzado}
      />
      {/* Fina línea central clara */}
      <path d={d} style={trazo} stroke={SOGA.colorNucleo} strokeWidth={SOGA.grosorNucleo} />
    </g>
  );
});

export default SogaTugOfWar;