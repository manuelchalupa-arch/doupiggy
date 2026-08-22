// components/SplashScreen.jsx
// Se muestra al abrir DouPiggy durante DURACION_MS y luego llama a onFinish().
// Usa las imágenes reales de src/assets/branding (logo + fondo de splash).

import { useEffect } from "react";
import { brandingAssets } from "../assets";

const DURACION_MS = 2200;

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
  aro: {
    width: 168,
    height: 168,
    borderRadius: "50%",
    background: "var(--cream)",
    border: "6px solid var(--ink)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    animation: "popIn 0.7s cubic-bezier(.34,1.56,.64,1)",
  },
  logoImg: { width: "78%", height: "78%", objectFit: "contain" },
  nombre: {
    marginTop: 18,
    fontFamily: "var(--font-display)",
    fontSize: 22,
    color: "var(--ink)",
    letterSpacing: 1,
    background: "var(--cream)",
    border: "4px solid var(--ink)",
    borderRadius: 16,
    padding: "6px 16px",
    boxShadow: "4px 4px 0 var(--ink)",
  },
  cargando: {
    marginTop: 16,
    color: "var(--paper)",
    fontFamily: "var(--font-display)",
    fontSize: 12,
    letterSpacing: 2,
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
        @keyframes popIn {
          0% { transform: scale(0) rotate(-30deg); }
          70% { transform: scale(1.15) rotate(6deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes parpadeo {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .splash-puntos span { animation: parpadeo 1.2s infinite; }
        .splash-puntos span:nth-child(2) { animation-delay: 0.2s; }
        .splash-puntos span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={estilos.aro}>
        <img src={brandingAssets.logo} alt="DouPiggy" style={estilos.logoImg} />
      </div>

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
