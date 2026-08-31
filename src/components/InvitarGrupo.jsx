// components/InvitarGrupo.jsx
// Botón "Invitar" reutilizable: genera un token con invitationService,
// muestra un link copiable y un acceso directo para compartirlo por
// WhatsApp. Se usa inmediatamente después de crear un grupo
// (CrearGrupoScreen, InfoProfile) y también podría reutilizarse desde
// cualquier otro punto que tenga un grupoId a mano.
//
// Quien recibe el enlace entra a la app con ?invite=TOKEN, App.jsx lo lee
// (ver leerYLimpiarTokenDeInvitacion) y muestra la pantalla de aceptación,
// que pide iniciar sesión con Google y llama a
// authService.unirseComoInvitado — ese usuario queda agregado a ESTE
// grupo puntual, sin perder la posibilidad de tener otros grupos propios.

import { useState } from "react";
import { crearInvitacion } from "../services/invitationService";
import { IconoInvitacion } from "./IconosRaster";

export default function InvitarGrupo({ grupoId, uidActual }) {
  const [link, setLink] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(null);

  async function generarLink() {
    setError(null);
    setGenerando(true);
    try {
      const { token } = await crearInvitacion(grupoId, uidActual);
      setLink(`${window.location.origin}/?invite=${token}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }

  async function copiarLink() {
    setError(null);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Navigator.clipboard puede no estar disponible (contexto inseguro o
      // permisos del navegador): fallback con selección + execCommand.
      await copiarConFallback(link);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  /** Fallback de copiado cuando la Clipboard API no está disponible. */
  async function copiarConFallback(texto) {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(area);
    }
  }

  function compartirPorWhatsapp() {
    const texto = encodeURIComponent(
      `¡Te invito a nuestro grupo de gastos compartidos en DouPiggy! Entrá acá: ${link}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
  }

  if (!link) {
    return (
      <button
        type="button"
        className="btn accion bloque"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={generarLink}
        disabled={generando}
      >
        <IconoInvitacion tamano={16} />
        {generando ? "Generando..." : "Invitar"}
      </button>
    );
  }

  return (
    <div>
      <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" className="btn chico" style={{ flex: 1 }} onClick={copiarLink}>
          {copiado ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <button
          type="button"
          className="btn chico"
          style={{ flex: 1, background: "#25D366", borderColor: "var(--ink)" }}
          onClick={compartirPorWhatsapp}
        >
          Enviar por WhatsApp
        </button>
      </div>
      {error && <p className="ayuda-error">{error}</p>}
    </div>
  );
}
