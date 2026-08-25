// components/Chanchito.jsx
// Sistema reutilizable de personaje (etapa 8): los mismos dos chanchitos
// (spriteAssets.pigBoy / pigGirl) evolucionando con distintos estados de
// animación en cada pantalla, en vez de un dibujo nuevo por lugar.
//
// Hoy sólo existe UN sprite por personaje (la pose de tironeo de Inicio),
// así que los estados se logran con animación CSS reutilizable (etapa 12)
// sobre esa misma imagen. El día que haya arte específico por estado
// (ej: pig-boy-happy.png), alcanza con:
//   1. importarlo en src/assets/index.js dentro de spriteAssets
//   2. agregar la entrada correspondiente en SPRITE_POR_ESTADO más abajo
// Ningún lugar que use <Chanchito /> necesita cambiar.
//
// Estados soportados: idle, happy, sad, angry, pulling, money, celebrate.

import { spriteAssets } from "../assets";

const SPRITE_POR_PERSONAJE = { boy: spriteAssets.pigBoy, girl: spriteAssets.pigGirl };

// Mapeo estado -> clase de animación reutilizable (definidas en theme.css).
const CLASE_POR_ESTADO = {
  idle: "",
  happy: "anim-bounce",
  sad: "anim-wiggle-lento",
  angry: "anim-shake",
  pulling: "anim-pull",
  money: "anim-pop",
  celebrate: "anim-celebrate",
};

/**
 * @param {object} props
 * @param {"boy"|"girl"} props.personaje
 * @param {"idle"|"happy"|"sad"|"angry"|"pulling"|"money"|"celebrate"} [props.estado]
 * @param {number} [props.size] - alto en px (el ancho se ajusta solo)
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function Chanchito({ personaje, estado = "idle", size = 96, className = "", style = {} }) {
  const src = SPRITE_POR_PERSONAJE[personaje];
  const claseAnimacion = CLASE_POR_ESTADO[estado] ?? "";
  // "sad" y "angry" además tiñen levemente el sprite: no hay arte propio
  // todavía, así que la emoción se apoya en color + movimiento.
  const filtro =
    estado === "sad" ? { filter: "grayscale(0.35) brightness(0.9)" } : estado === "angry" ? { filter: "saturate(1.4)" } : null;

  return (
    <img
      src={src}
      alt=""
      className={`chanchito ${claseAnimacion} ${className}`.trim()}
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        transformOrigin: "bottom center",
        display: "block",
        ...filtro,
        ...style,
      }}
    />
  );
}
