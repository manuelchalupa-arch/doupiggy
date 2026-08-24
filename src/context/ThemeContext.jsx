// context/ThemeContext.jsx
// Modo día / modo noche con paletas de color REALES y distintas (definidas
// en styles/theme.css como .tema-dia / .tema-noche) — ya no es un filtro de
// brillo. Se persiste en localStorage y respeta la preferencia del sistema
// operativo la primera vez que se abre la app.

import { createContext, useContext, useEffect, useState } from "react";

const CLAVE_STORAGE = "doupiggy:tema";

function temaInicial() {
  if (typeof window === "undefined") return "dia";
  const guardado = window.localStorage.getItem(CLAVE_STORAGE);
  if (guardado === "dia" || guardado === "noche") return guardado;
  const prefiereOscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefiereOscuro ? "noche" : "dia";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_STORAGE, tema);
  }, [tema]);

  const alternarModo = () => setTema((t) => (t === "dia" ? "noche" : "dia"));

  return (
    <ThemeContext.Provider value={{ tema, modoOscuro: tema === "noche", alternarModo }}>
      <div className={`app-root tema-${tema}`}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
