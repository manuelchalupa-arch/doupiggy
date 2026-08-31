// components/SplashScreen.jsx
// Splash: barra de carga con forma de soga — una soga (brandingAssets.soga)
// como carril y un moño rojo (brandingAssets.monoRojo) que se desliza de
// izquierda a derecha marcando el progreso hasta entrar al grupo, con el
// texto "CARGANDO" asomando debajo. El logo y la imagen título se sacaron
// del splash: el fondo ya lleva la marca.

import { useEffect } from "react";
import { brandingAssets } from "../assets";

const DURACION_MS = 4000;

// La barra de carga (soga + moño) y el "CARGANDO" se empujan este tanto hacia
// abajo dentro de la pantalla (~4 cm en pantallas de densidad normal).
const CORRIMIENTO_VERTICAL_PX = 150;

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
  medidor: {
    position: "relative",
    width: "min(78vw, 320px)",
  },
  soga: {
    display: "block",
    width: "100%",
    height: "auto",
    filter: "drop-shadow(3px 3px 0 var(--ink))",
  },
  mono: {
    position: "absolute",
    top: "50%",
    left: "5%",
    width: 52,
    height: "auto",
    transform: "translate(-50%, -50%)",
    animation: "deslizarSoga 3.5s cubic-bezier(.4,0,.2,1) forwards",
  },
  contenido: {
    transform: `translateY(${CORRIMIENTO_VERTICAL_PX}px)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cargando: {
    marginTop: 14,
    color: "var(--paper)",
    fontFamily: "var(--font-display)",
    fontSize: 13,
    letterSpacing: 2,
    opacity: 0,
    animation: "splashTitulo 0.5s ease 0.35s forwards",
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
        @keyframes deslizarSoga {
          0% { left: 5%; }
          100% { left: 95%; }
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

      <div style={estilos.contenido}>
        <div className="splash-medidor" style={estilos.medidor}>
          <img src={brandingAssets.soga} alt="" style={estilos.soga} />
          <img src={brandingAssets.monoRojo} alt="" className="splash-mono" style={estilos.mono} />
        </div>

        <div style={estilos.cargando}>
          CARGANDO
          <span className="splash-puntos">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}