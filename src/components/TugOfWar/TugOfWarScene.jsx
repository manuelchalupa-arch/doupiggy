// components/TugOfWar/TugOfWarScene.jsx
// Escena "tira y afloje" reconstruida con elementos independientes:
//
//   TugOfWarScene
//   ├── PigLeft    (PersonajeTugOfWar)
//   ├── Soga       (SogaTugOfWar: trayectoria + apariencia)
//   ├── BalanceMarker (MarcadorBalance)
//   └── PigRight   (PersonajeTugOfWar)
//
// Todo vive dentro de un <svg> con viewBox lógico, así la escena entera
// (soga, personajes y marcador) escala proporcionalmente en cualquier tamaño
// de pantalla sin posiciones absolutas por dispositivo.
//
// Sistema de posicionamiento: el marcador recorre EXACTAMENTE la trayectoria
// SVG (getPointAtLength) según un resorte suave hacia la posición objetivo
// provista por calcularPosicionBalance — nunca se mueve en línea recta por X.
//
// Animación determinística (sin motores): resorte para el movimiento
// principal (pequeño "tirón" al cambiar el saldo), vaivén idle mínimo del
// marcador y de los personajes, y reacción de tensión de los personajes.
// Todo se apaga con prefers-reduced-motion (salvo el movimiento de datos).

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  ESCENA,
  PERSONAJE_IZQ,
  PERSONAJE_DER,
  SOGA,
  ANIMACION,
} from "./configuracion";
import SogaTugOfWar from "./SogaTugOfWar";
import PersonajeTugOfWar from "./PersonajeTugOfWar";
import MarcadorBalance from "./MarcadorBalance";

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Transform que alinea la mano del personaje con un extremo de la soga. */
function transformDePersonaje(config, extremoX, extremoY) {
  const s = config.ancho / config.recorte.w;
  return {
    s,
    gx: extremoX - config.mano.x * s,
    gy: extremoY - config.mano.y * s,
  };
}

/** Renderiza el personaje (traduce al punto de la soga + aplica vaivén). */
function aplicarTransform(grupo, t, desplX, desplY) {
  if (!grupo) return;
  grupo.setAttribute(
    "transform",
    `translate(${(t.gx + desplX).toFixed(2)} ${(t.gy + desplY).toFixed(2)}) scale(${t.s})`
  );
}

/**
 * @param {object} props
 * @param {number} props.posicion - posición normalizada [0,1] (0.5 = equilibrio)
 */
export default function TugOfWarScene({ posicion }) {
  const pathRef = useRef(null);
  const marcadorRef = useRef(null);
  const pigIzqRef = useRef(null);
  const pigDerRef = useRef(null);

  // Estado de la animación fuera de React (se lee/escribe en cada frame).
  const anim = useRef({
    frac: clamp01(posicion),
    vel: 0,
    objetivo: clamp01(posicion),
    longitud: 0,
    listo: false,
    ultimoT: 0,
  });

  const geom = useMemo(() => ({
    izq: transformDePersonaje(PERSONAJE_IZQ, SOGA.extremoIzq.x, SOGA.extremoIzq.y),
    der: transformDePersonaje(PERSONAJE_DER, SOGA.extremoDer.x, SOGA.extremoDer.y),
  }), []);

  // La CPU recibe el objetivo nuevo (cambio de saldo real) sin re-renderizar
  // React; el loop de abajo lo lee siempre actualizado.
  useEffect(() => {
    anim.current.objetivo = clamp01(posicion);
    const path = pathRef.current;
    if (path && path.getTotalLength) {
      anim.current.longitud = path.getTotalLength();
      anim.current.listo = true;
    }
  }, [posicion]);

  // Primer pintado correcto (antes de que corra el loop): personajes alineados
  // a la soga y marcador en su posición actual, para que no haya un cuadro
  // con elementos en el origen del viewBox.
  useLayoutEffect(() => {
    aplicarTransform(pigIzqRef.current, geom.izq, 0, 0);
    aplicarTransform(pigDerRef.current, geom.der, 0, 0);
    const path = pathRef.current;
    if (path) {
      const punto = path.getPointAtLength(clamp01(anim.current.frac) * path.getTotalLength());
      marcadorRef.current?.setAttribute(
        "transform",
        `translate(${punto.x.toFixed(2)} ${punto.y.toFixed(2)})`
      );
    }
  }, [geom]);

  useEffect(() => {
    let idFrame;
    const { resorte, vaivenMarcador, inclinacionMax, tironPersonajes, vaivenPersonajes } = ANIMACION;

    const loop = (t) => {
      const a = anim.current;
      const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      if (a.ultimoT && (a.listo || pathRef.current)) {
        const dt = Math.min((t - a.ultimoT) / 1000, 0.05);
        const k = reducido ? 0 : resorte.k;
        const c = reducido ? 0 : resorte.c;

        // Resorte suave hacia el objetivo (determinístico) o, con reduced
        // motion, un acercamiento lineal y sedoso sin rebase.
        const diff = a.objetivo - a.frac;
        if (reducido) {
          a.frac += (diff * Math.min(dt * 3.2, 1));
        } else {
          const acel = k * diff - c * a.vel;
          a.vel += acel * dt;
          a.frac += a.vel * dt;
        }
        // Vaivén sutil sobre la trayectoria (solo idle, se apaga con reduced motion).
        if (!reducido) {
          a.frac += Math.sin((t / 1000) * ((Math.PI * 2) / vaivenMarcador.periodo)) * vaivenMarcador.amplitudFrac * 0.35;
        }

        const path = pathRef.current;
        if (path) {
          a.longitud = path.getTotalLength();
          const fracSano = clamp01(a.frac);
          const punto = path.getPointAtLength(fracSano * a.longitud);
          const marcador = marcadorRef.current;
          if (marcador) {
            // Reacción visual al moverse: inclinación según velocidad
            // + vaivén vertical mínimo sobre la trayectoria.
            const velPx = a.vel * a.longitud;
            const incl = Math.max(-inclinacionMax, Math.min(inclinacionMax, velPx * 1.2));
            const va = reducido ? 0 : Math.sin((t / 1000) * ((Math.PI * 2) / vaivenMarcador.periodo)) * vaivenMarcador.amplitudY;
            marcador.setAttribute(
              "transform",
              `translate(${punto.x.toFixed(2)} ${(punto.y + va).toFixed(2)}) rotate(${incl.toFixed(2)})`
            );
          }

          const tPers = t / 1000;
          const sway = reducido ? 0 : Math.sin(tPers * vaivenPersonajes.periodo) * vaivenPersonajes.amplitud;
          const tiron = reducido ? 0 : -a.vel * a.longitud * tironPersonajes;
          aplicarTransform(pigIzqRef.current, geom.izq, tiron, sway);
          aplicarTransform(
            pigDerRef.current,
            geom.der,
            -tiron,
            reducido ? 0 : Math.sin(tPers * vaivenPersonajes.periodo + vaivenPersonajes.desfaseDer) * vaivenPersonajes.amplitud
          );
        }
      }
      a.ultimoT = t;
      idFrame = requestAnimationFrame(loop);
    };

    idFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(idFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="escena-tugofwar" style={{ width: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${ESCENA.ancho} ${ESCENA.alto}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <SogaTugOfWar ref={pathRef} />
        <PersonajeTugOfWar ref={pigIzqRef} config={PERSONAJE_IZQ} />
        <MarcadorBalance ref={marcadorRef} />
        <PersonajeTugOfWar ref={pigDerRef} config={PERSONAJE_DER} />
      </svg>
    </div>
  );
}