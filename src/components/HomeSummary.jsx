// components/HomeSummary.jsx
// Pestaña Inicio: saldo neto, cuerda con dos cerditos, y mini-resumen.
//
// Rediseño integral: dos cerditos varones
//   - Cerdito 1 (derecha): rico, arrogante, traje, sombrero de copa
//   - Cerdito 2 (izquierda): humilde, alegre, chaleco, gorra plana
// La cuerda se inclina según el saldo: hacia la derecha = saldo positivo
// (el rico "gana"), hacia la izquierda = saldo negativo (el humilde "pierde").

import { useMemo } from "react";
import { backgroundAssets, spriteAssets } from "../assets";
import { formatoARS } from "../utils/format";
import Chanchito from "./Chanchito";

const UMBRAL_NEUTRO = 500;
const UMBRAL_ALTO = 5000;

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 * @param {string} props.nombreGrupo
 */
export default function HomeSummary({ uidActual, miembros, gastos, nombreGrupo }) {
  const saldo = useMemo(() => {
    let s = 0;
    for (const g of gastos) {
      const partes = g.participantes?.length || 1;
      const miParte = g.monto / partes;
      if (g.pagadoPor === uidActual) s += g.monto - miParte;
      else if ((g.participantes || []).includes(uidActual)) s -= miParte;
    }
    return s;
  }, [gastos, uidActual]);

  const totalGastado = useMemo(
    () => gastos.reduce((a, g) => a + g.monto, 0),
    [gastos]
  );

  const nivel = useMemo(() => {
    if (saldo <= -UMBRAL_ALTO) return "muy-debe";
    if (saldo <= -UMBRAL_NEUTRO) return "debe";
    if (saldo >= UMBRAL_ALTO) return "le-deben-mucho";
    if (saldo >= UMBRAL_NEUTRO) return "le-deben";
    return "neutral";
  }, [saldo]);

  const fondo = backgroundAssets.nivel[nivel];

  const { texto, sub } = useMemo(() => {
    if (saldo >= UMBRAL_ALTO)
      return { texto: "¡Te deben un montón!", sub: "Sos el rey de la finanza" };
    if (saldo >= UMBRAL_NEUTRO)
      return { texto: "Te deben plata", sub: "Estás en números azules" };
    if (saldo <= -UMBRAL_ALTO)
      return { texto: "¡Debés un montón!", sub: "Hay que ajustar el cinturón" };
    if (saldo <= -UMBRAL_NEUTRO)
      return { texto: "Debés plata", sub: "Falta equilibrar un poco" };
    return { texto: "Estamos a mano", sub: "Ni debe ni le deben" };
  }, [saldo]);

  const offsetX = useMemo(() => {
    if (nivel === "muy-debe") return -46;
    if (nivel === "debe") return -24;
    if (nivel === "neutral") return 0;
    if (nivel === "le-deben") return 24;
    return 46;
  }, [nivel]);

  return (
    <div
      className="tarjeta"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "18px 0 10px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: 0.5,
            margin: "2px 0 0",
            lineHeight: 1.05,
          }}
        >
          {texto}
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 36,
            margin: "2px 0 0",
            lineHeight: 1,
          }}
        >
          {formatoARS.format(Math.abs(saldo))}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink)",
            opacity: 0.7,
            margin: "3px 0 0",
          }}
        >
          {sub}
        </p>
      </div>

      {/* Escena de la cuerda */}
      <div
        style={{
          position: "relative",
          height: 140,
          margin: "10px 0",
        }}
      >
        {/* Cerdito 2 — humilde, alegre, izquierda, tira hacia la izquierda */}
        <img
          src={spriteAssets.cerdito2}
          alt="Cerdito humilde tironeando"
          className="cerdito2-sprite"
          style={{
            position: "absolute",
            bottom: 0,
            left: 4,
            height: 120,
            zIndex: 3,
          }}
        />

        {/* Cerdito 1 — rico, arrogante, derecha, tira hacia la derecha */}
        <img
          src={spriteAssets.cerdito1}
          alt="Cerdito rico tironeando"
          className="cerdito1-sprite"
          style={{
            position: "absolute",
            bottom: 0,
            right: 4,
            height: 120,
            zIndex: 3,
          }}
        />

        {/* Cuerda */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 200,
            height: 4,
            background: "var(--ink)",
            borderRadius: 2,
            transform: `translate(-50%, -50%) translateX(${offsetX}px) rotate(${
              offsetX * 0.15
            }deg)`,
            transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 2,
          }}
        />

        {/* Indicador central */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 24,
            height: 24,
            background: "var(--gold)",
            border: "2px solid var(--ink)",
            borderRadius: "50%",
            transform: `translate(-50%, -50%) translateX(${offsetX}px)`,
            transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 4,
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              textAlign: "center",
              border: "2px solid var(--ink)",
              borderRadius: 10,
              padding: "8px 4px",
              background: "var(--paper)",
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
              Total gastado
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontFamily: "var(--font-mono)",
                fontSize: 18,
              }}
            >
              {formatoARS.format(totalGastado)}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              border: "2px solid var(--ink)",
              borderRadius: 10,
              padding: "8px 4px",
              background: "var(--paper)",
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
              Miembros
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontFamily: "var(--font-mono)",
                fontSize: 18,
              }}
            >
              {miembros.length}
            </p>
          </div>
        </div>

        <Chanchito nivel={nivel} />
      </div>
    </div>
  );
}
