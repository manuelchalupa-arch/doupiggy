// components/SplashScreen.jsx
// Splash mejorado: el logo entra con un efecto de "cortina de cine" (barrido
// + rebote), y el nombre aparece con una leve demora tipo intertítulo de
// película muda. Duración más corta e intencional: se siente a animación,
// no a espera.

import { useEffect } from "react";
import { brandingAssets } from "../assets";

const DURACION_MS = 1700;

const estilos = {
  splash: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `url(${brandingAssets.splash})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    zIndex: 100,
  },
  logo: {
    width: "min(70vw, 320px)",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(4px 4px 0 var(--ink))",
    animation: "splashPop 0.6s cubic-bezier(.34,1.56,.64,1)",
  },
  nombre: {
    marginTop: 18,
    fontFamily: "var(--font-display)",
    fontSize: 26,
    color: "var(--ink)",
    letterSpacing: 1,
    background: "var(--cream)",
    border: "4px solid var(--ink)",
    borderRadius: 16,
    padding: "6px 18px",
    boxShadow: "4px 4px 0 var(--ink)",
    opacity: 0,
    animation: "splashTitulo 0.5s ease 0.35s forwards",
  },
  cargando: {
    marginTop: 16,
    color: "var(--paper)",
    fontFamily: "var(--font-display)",
    fontSize: 13,
    letterSpacing: 2,
    opacity: 0,
    animation: "splashTitulo 0.5s ease 0.6s forwards",
  },
};

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, DURACION_MS);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={estilos.splash}>
      <style>{`
        @keyframes splashPop {
          0% { transform: scale(0) rotate(-35deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes splashTitulo {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes parpadeo {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .splash-puntos span { animation: parpadeo 1.1s infinite; }
        .splash-puntos span:nth-child(2) { animation-delay: 0.18s; }
        .splash-puntos span:nth-child(3) { animation-delay: 0.36s; }
      `}</style>

      <img src={brandingAssets.logo} alt="DouPiggy" style={estilos.logo} />

      <div style={estilos.nombre}>DouPiggy</div>

      <div style={estilos.cargando}>
        CARGANDO
        <span className="splash-puntos">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  );
}
