// components/HomeSummary.jsx
// Traduce el saldo neto REAL del usuario actual (calculado con
// settlementService.calcularSaldosNetos) a una de 5 "zonas" visuales, cada
// una con su propio fondo (src/assets/backgrounds/bg-levelN.png), y anima
// la cuerda con los sprites reales (pig-boy, pig-girl, rope-arrow).

import { useMemo } from "react";
import { calcularSaldosNetos } from "../services/settlementService";
import { backgroundAssets, spriteAssets } from "../assets";

// Umbrales en pesos argentinos: ajustables según el uso real del grupo.
const UMBRAL_NEUTRO = 500;
const UMBRAL_ALTO = 10000;

function calcularZona(saldo) {
  if (saldo <= -UMBRAL_ALTO) return "muy-debe";
  if (saldo < -UMBRAL_NEUTRO) return "debe";
  if (saldo <= UMBRAL_NEUTRO) return "neutral";
  if (saldo < UMBRAL_ALTO) return "le-deben";
  return "le-deben-mucho";
}

// Cuánto se corre el nudo/flecha de la cuerda y su detalle textual por zona.
const DATOS_ZONA = {
  "muy-debe": { detalle: "Debés bastante", offsetX: -60, angulo: -14 },
  debe: { detalle: "Debés un poco", offsetX: -28, angulo: -6 },
  neutral: { detalle: "Están a mano", offsetX: 0, angulo: 0 },
  "le-deben": { detalle: "Te deben un poco", offsetX: 28, angulo: 6 },
  "le-deben-mucho": { detalle: "Te deben bastante", offsetX: 60, angulo: 14 },
};

import { formatoARS } from "../utils/format";

// Geometría compartida entre los sprites y la soga: antes eran números
// mágicos repetidos (150, 6, 92...) sin relación explícita entre sí, lo que
// hacía que la flecha quedara desalineada de las manos de los chanchitos
// apenas cambiaba el tamaño real de un sprite. Ahora la posición vertical
// de la soga se calcula a partir de estas mismas constantes.
const SPRITE_ANCHO = 118;
const SPRITE_ALTO = 150;
const SPRITE_BOTTOM = 6;
const SOGA_ALTO_RELATIVO = 0.58; // 0 = base del sprite, 1 = punta de la cabeza
const SOGA_TOP = SPRITE_BOTTOM + SPRITE_ALTO * (1 - SOGA_ALTO_RELATIVO);

/**
 * @param {object} props
 * @param {object} props.grupo
 * @param {Array} props.gastos
 * @param {Array<{uid:string,nombre:string}>} props.miembros
 * @param {string} props.uidActual
 */
export default function HomeSummary({ grupo, gastos, miembros, uidActual }) {
  const saldoActual = useMemo(() => {
    const saldos = calcularSaldosNetos(gastos);
    return saldos[uidActual] ?? 0;
  }, [gastos, uidActual]);

  const zona = calcularZona(saldoActual);
  const d = DATOS_ZONA[zona];
  const fondoZona = backgroundAssets.nivel[zona];

  return (
    <div
      style={{
        margin: "-18px -16px 0",
        padding: "18px 16px 24px",
        backgroundImage: `url(${fondoZona})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.4s ease",
      }}
    >
      <div className="tarjeta">
        <span className="etiqueta">Resumen</span>
        <h2>Balance del grupo</h2>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--ink)", margin: "2px 0 0" }}>
          {saldoActual >= 0 ? "+" : ""}
          {formatoARS.format(saldoActual)}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--burnt)", margin: 0 }}>{d.detalle}</p>

        <CuerdaAnimada offsetX={d.offsetX} angulo={d.angulo} />
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Grupo</span>
        <h2>{grupo?.nombre ?? "Tu grupo"}</h2>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          {miembros.length} integrante{miembros.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

/**
 * Cuerda con los sprites reales: pig-boy a la izquierda, pig-girl a la
 * derecha, y rope-arrow en el medio indicando el balance. `offsetX` corre
 * la flecha hacia el lado que "gana" el tironeo; `angulo` la inclina.
 */
function CuerdaAnimada({ offsetX, angulo }) {
  return (
    <div style={{ position: "relative", height: 190, marginTop: 6 }}>
      <style>{`
        @keyframes tironIzq { from { transform: rotate(-5deg); } to { transform: rotate(3deg); } }
        @keyframes tironDer { from { transform: rotate(5deg); } to { transform: rotate(-3deg); } }
        .pig-boy-sprite { animation: tironIzq 1.1s ease-in-out infinite alternate; transform-origin: bottom center; }
        .pig-girl-sprite { animation: tironDer 1.1s ease-in-out infinite alternate; transform-origin: bottom center; }
      `}</style>

      <img
        src={spriteAssets.pigBoy}
        alt="Chanchito tironeando desde la izquierda"
        className="pig-boy-sprite"
        style={{
          position: "absolute",
          left: 4,
          bottom: SPRITE_BOTTOM,
          width: SPRITE_ANCHO,
          height: SPRITE_ALTO,
          objectFit: "contain",
        }}
      />
      <img
        src={spriteAssets.pigGirl}
        alt="Chanchita tironeando desde la derecha"
        className="pig-girl-sprite"
        style={{
          position: "absolute",
          right: 4,
          bottom: SPRITE_BOTTOM,
          width: SPRITE_ANCHO,
          height: SPRITE_ALTO,
          objectFit: "contain",
        }}
      />
      <img
        src={spriteAssets.ropeArrow}
        alt="Cuerda con flecha indicadora del balance"
        style={{
          position: "absolute",
          left: "50%",
          top: SOGA_TOP,
          width: 200,
          transform: `translateX(calc(-50% + ${offsetX}px)) rotate(${angulo}deg)`,
          transition: "transform 0.6s ease",
        }}
      />
    </div>
  );
}
