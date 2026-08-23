// components/InvitarGrupo.jsx
// Botón "Invitar" reutilizable: genera un token con invitationService y
// muestra un link copiable. Se usa inmediatamente después de crear un
// grupo (CrearGrupoScreen, InfoProfile) y también podría reutilizarse
// desde cualquier otro punto que tenga un grupoId a mano.
//
// LIMITACIÓN CONOCIDA: el link generado (?invite=TOKEN) todavía no tiene
// una pantalla del lado de quien lo recibe que lea ese parámetro y llame a
// authService.unirseComoInvitado — eso es un desarrollo aparte (Bloque 2
// ya tiene la lógica de invitationService/authService lista, falta la
// ruta de aceptación en App.jsx).

import { useState } from "react";
import { crearInvitacion } from "../services/invitationService";

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
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  if (!link) {
    return (
      <button type="button" className="btn bloque" onClick={generarLink} disabled={generando}>
        {generando ? "Generando..." : "Invitar"}
      </button>
    );
  }

  return (
    <div>
      <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
      <button type="button" className="btn chico bloque" style={{ marginTop: 8 }} onClick={copiarLink}>
        {copiado ? "¡Copiado!" : "Copiar enlace"}
      </button>
      {error && <p className="ayuda-error">{error}</p>}
    </div>
  );
}
