// components/HomeSummary.jsx
// Traduce el saldo neto REAL del usuario actual a una de 5 "zonas" visuales,
// cada una con su propio fondo a pantalla completa. Las tarjetas de encima
// ahora son semitransparentes (.tarjeta-flotante) para que el fondo se siga
// viendo, y la cuerda ya NO usa una flecha/brújula superpuesta: el balance
// se lee directo en el tironeo de la soga (inclinación + desplazamiento) y
// en el número de arriba.

import { useMemo } from "react";
import { calcularSaldosNetos } from "../services/settlementService";
import { backgroundAssets, spriteAssets } from "../assets";
import { formatoARS } from "../utils/format";

const UMBRAL_NEUTRO = 500;
const UMBRAL_ALTO = 10000;

function calcularZona(saldo) {
  if (saldo <= -UMBRAL_ALTO) return "muy-debe";
  if (saldo < -UMBRAL_NEUTRO) return "debe";
  if (saldo <= UMBRAL_NEUTRO) return "neutral";
  if (saldo < UMBRAL_ALTO) return "le-deben";
  return "le-deben-mucho";
}

// offsetX: cuánto se corre el nudo de la soga hacia el lado que "gana".
// angulo: inclinación de la soga (reemplaza a la vieja flecha/brújula).
const DATOS_ZONA = {
  "muy-debe": { detalle: "Debés bastante", offsetX: -46, angulo: -10 },
  debe: { detalle: "Debés un poco", offsetX: -22, angulo: -5 },
  neutral: { detalle: "Están a mano", offsetX: 0, angulo: 0 },
  "le-deben": { detalle: "Te deben un poco", offsetX: 22, angulo: 5 },
  "le-deben-mucho": { detalle: "Te deben bastante", offsetX: 46, angulo: 10 },
};

const SPRITE_ANCHO = 118;
const SPRITE_ALTO = 150;
const SPRITE_BOTTOM = 6;
const SOGA_TOP = SPRITE_BOTTOM + SPRITE_ALTO * 0.42;

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
        minHeight: "calc(100vh - 100px)",
        padding: "18px 16px 24px",
        backgroundImage: `url(${fondoZona})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.4s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tarjetas chicas y semitransparentes arriba, para no tapar el fondo */}
      <div className="tarjeta-flotante">
        <span className="etiqueta">Resumen</span>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", margin: "2px 0 0" }}>
          {saldoActual >= 0 ? "+" : ""}
          {formatoARS.format(saldoActual)}
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--burnt)", margin: 0 }}>{d.detalle}</p>
      </div>

      {/* La cuerda queda libre en el medio, sobre el fondo, sin tarjeta encima */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 190 }}>
        <CuerdaAnimada offsetX={d.offsetX} angulo={d.angulo} />
      </div>

      <div className="tarjeta-flotante" style={{ marginBottom: 0 }}>
        <span className="etiqueta">Grupo</span>
        <h2 style={{ margin: 0 }}>{grupo?.nombre ?? "Tu grupo"}</h2>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
          {miembros.length} integrante{miembros.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

/**
 * Cuerda con los sprites reales: pig-boy a la izquierda, pig-girl a la
 * derecha. El balance se transmite con la inclinación y el desplazamiento
 * de la soga misma — ya no hay una flecha/brújula superpuesta.
 */
function CuerdaAnimada({ offsetX, angulo }) {
  return (
    <div style={{ position: "relative", height: 190, width: "100%" }}>
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

      {/* Soga: una línea gruesa con contorno tipo caricatura, que se inclina
          y se corre según el balance. Sin flecha superpuesta. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SOGA_TOP,
          width: 210,
          height: 10,
          background: "var(--burnt)",
          border: "3px solid var(--ink)",
          borderRadius: 8,
          transform: `translateX(calc(-50% + ${offsetX}px)) rotate(${angulo}deg)`,
          transition: "transform 0.6s ease",
        }}
      />
    </div>
  );
}
