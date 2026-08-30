// components/InstalarApp.jsx
// Botón de descarga/instalación (PWA), en Info > Configuración. Si el
// navegador ofrece instalar (beforeinstallprompt), dispara la instalación;
// si no (iPhone/iPad, etc.), abre una ayuda compacta con los pasos para
// añadir la app a la pantalla de inicio.

import { useEffect, useState } from "react";
import {
  obtenerPromptInstalacion,
  estaInstalada,
  suscribirse,
} from "../services/instalacionPwa";

function esIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstalarApp() {
  const [prompt, setPrompt] = useState(() => obtenerPromptInstalacion());
  const [instalada, setInstalada] = useState(() => estaInstalada());
  const [instalando, setInstalando] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      setPrompt(obtenerPromptInstalacion());
      setInstalada(estaInstalada());
    };
    actualizar();
    return suscribirse(actualizar);
  }, []);

  async function instalar() {
    if (!prompt) return;
    setInstalando(true);
    try {
      prompt.prompt();
      const eleccion = await prompt.userChoice;
      if (eleccion.outcome === "accepted") setPrompt(null);
    } catch {
      // el usuario cerró el diálogo o el navegador lo revocó: no pasa nada
    } finally {
      setInstalando(false);
    }
  }

  if (instalada) return null;

  return (
    <>
      <button
        type="button"
        className="boton-icono"
        aria-label={instalando ? "Instalando..." : prompt ? "Descargar e instalar" : "Cómo instalar la aplicación"}
        title={prompt ? "Descargar e instalar" : "Cómo instalar la aplicación"}
        onClick={prompt ? instalar : () => setMostrarAyuda((v) => !v)}
        disabled={instalando}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ flex: "none" }} aria-hidden="true">
          <path
            d="M12 3 V15 M7 10 L12 15 L17 10 M4 20 H20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {mostrarAyuda && (
        <div className="ayuda-instalar">
          {esIos() ? (
            <>
              <p style={{ margin: "0 0 6px", fontWeight: 700 }}>
                Para instalar en iPhone/iPad:
              </p>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                <li>Toquen el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba).</li>
                <li>Toquen <strong>Añadir a pantalla de inicio</strong>.</li>
                <li>Confirmen en <strong>Agregar</strong>.</li>
              </ol>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                Se instala desde un navegador compatible (Chrome, Edge) cargando
                esta página. Cuando el navegador esté listo, este botón pasa a
                <strong> Descargar e instalar</strong>.
              </p>
              <p style={{ margin: "6px 0 0" }}>
                También podés usar el menú del navegador (⋮ o el ícono de
                instalar junto a la barra de direcciones).
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}