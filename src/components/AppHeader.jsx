// components/AppHeader.jsx
// Header persistente con forma de "cartel/cartelera" de cartoon.
// Izquierda: imagen título (brandingAssets.titulo), animada al cambiar de
// pestaña (se remonta con key={tab}).
// Derecha: el cartel de madera (brandingAssets.madera) ahora es GRANDE y
// es él mismo el botón selector de grupo — el nombre del grupo activo se
// dibuja encima, en dorado con relieve (degradé + sombras para el efecto
// grabado/brillante). Al tocarlo despliega un menú propio (no un <select>
// nativo, que se veía sin estilo) con la lista de grupos, coherente con
// el resto de la app. Elegir una opción actualiza de verdad el grupo
// activo (onCambiarGrupo), no solo el texto mostrado.

import { useEffect, useRef, useState } from "react";
import { brandingAssets } from "../assets";

/**
 * @param {object} props
 * @param {string} props.tab - pestaña activa (dispara la animación de la imagen título)
 * @param {string} [props.grupoId]
 * @param {Array<{id: string, nombre: string}>} [props.grupos]
 * @param {(id: string) => void} [props.onCambiarGrupo]
 */
export default function AppHeader({ tab, grupoId, grupos = [], onCambiarGrupo }) {
  const grupoActivo = grupos.find((g) => g.id === grupoId);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // Cerrar al tocar afuera o al apretar Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    function alTocarAfuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    }
    function alTeclado(evento) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alTocarAfuera);
    document.addEventListener("keydown", alTeclado);
    return () => {
      document.removeEventListener("mousedown", alTocarAfuera);
      document.removeEventListener("keydown", alTeclado);
    };
  }, [abierto]);

  function elegir(id) {
    onCambiarGrupo?.(id); // esto es lo que realmente cambia el grupo activo
    setAbierto(false);
  }

  return (
    <header className="cartel-header">
      <img key={tab} src={brandingAssets.titulo} alt="DouPiggy" className="header-titulo-animado" />

      {grupoActivo && (
        <div className="cartel-madera-selector" ref={contenedorRef}>
          <button
            type="button"
            className="cartel-madera-boton"
            style={{ backgroundImage: `url(${brandingAssets.madera})` }}
            onClick={() => setAbierto((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={abierto}
            aria-label={`Grupo activo: ${grupoActivo.nombre}. Tocar para cambiar de grupo.`}
          >
            <span className="cartel-madera-texto">{grupoActivo.nombre}</span>
            <span className={`cartel-madera-flecha${abierto ? " abierta" : ""}`} aria-hidden="true">
              ▾
            </span>
          </button>

          {abierto && (
            <ul className="cartel-madera-menu" role="listbox" aria-label="Elegir grupo">
              {grupos.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={g.id === grupoId}
                    className={`cartel-madera-menu-item${g.id === grupoId ? " sel" : ""}`}
                    onClick={() => elegir(g.id)}
                  >
                    {g.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  );
}
