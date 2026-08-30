// components/TugOfWar/PersonajeTugOfWar.jsx
// Un personaje COMPLETO de la escena (CerdoIzquierdo o CerdoDerecho).
//
// Se dibuja el recorte configurado de su imagen original a través de un
// clipPath, escalado de forma uniforme (nunca deformado) al ancho configurado
// en unidades lógicas. El <g> exterior recibe `ref`: la escena le aplica cada
// cuadro translate + scale (y el vaivén sutil) sin re-renderizar.
//
// El punto de la mano (config.mano) queda alineado con el extremo de la soga
// por la escena al calcular el transform inicial; acá no se sabe nada de soga
// ni de otros elementos: el personaje es 100% reemplazable.

import { forwardRef, useId } from "react";

const PersonajeTugOfWar = forwardRef(function PersonajeTugOfWar({ config }, ref) {
  const idClip = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <g ref={ref} className="personaje-tugofwar">
      <clipPath id={idClip}>
        <rect
          x={config.recorte.x}
          y={config.recorte.y}
          width={config.recorte.w}
          height={config.recorte.h}
        />
      </clipPath>
      <g clipPath={`url(#${idClip})`}>
        <image
          href={config.src}
          x={0}
          y={0}
          width={config.sprite.w}
          height={config.sprite.h}
        />
      </g>
    </g>
  );
});

export default PersonajeTugOfWar;