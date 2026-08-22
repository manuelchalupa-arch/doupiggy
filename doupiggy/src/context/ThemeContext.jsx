// context/ThemeContext.jsx
// El modo oscuro NUNCA cambia la paleta de colores: solo aplica un filtro de
// brillo/contraste sobre el contenedor raíz de la app (ver .app-root.modo-oscuro
// en styles/theme.css). Esto se pidió explícitamente en el brief de diseño.

import { createContext, useContext, useEffect, useState } from "react";

const CLAVE_STORAGE = "gastos-compartidos:modo";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [modoOscuro, setModoOscuro] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CLAVE_STORAGE) === "oscuro";
  });

  useEffect(() => {
    window.localStorage.setItem(CLAVE_STORAGE, modoOscuro ? "oscuro" : "claro");
  }, [modoOscuro]);

  const alternarModo = () => setModoOscuro((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ modoOscuro, alternarModo }}>
      <div className={`app-root${modoOscuro ? " modo-oscuro" : ""}`}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
