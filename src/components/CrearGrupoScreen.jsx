// components/CrearGrupoScreen.jsx
// Se muestra cuando el usuario ya inició sesión pero todavía no es miembro
// de ningún grupo (típicamente: primer login). Tras crear el grupo, NO pasa
// directo a AppShell: llama a onCreado(grupoId) para que App.jsx muestre
// primero la pantalla de invitar, y recién después pasa a AppShell.

import { useState } from "react";
import { crearGrupo } from "../services/groupService";
import { brandingAssets } from "../assets";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {object} props.usuarioAuth - objeto de Firebase Auth (para nombre/foto)
 * @param {(grupoId: string) => void} props.onCreado
 */
export default function CrearGrupoScreen({ uidActual, usuarioAuth, onCreado }) {
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    setError(null);
    setCreando(true);
    try {
      const grupoId = await crearGrupo({
        nombre: nombre.trim(),
        creadoPor: uidActual,
        nombreCreador: usuarioAuth?.displayName ?? "Vos",
        fotoCreador: usuarioAuth?.photoURL ?? null,
      });
      onCreado(grupoId);
    } catch (err) {
      setError(err.message);
      setCreando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 16,
      }}
    >
      <img src={brandingAssets.logo} alt="DouPiggy" style={{ width: 96, height: 96, objectFit: "contain" }} />

      <div className="tarjeta" style={{ width: "100%", maxWidth: 360 }}>
        <span className="etiqueta">Primeros pasos</span>
        <h2>Creá tu primer grupo</h2>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          Es el espacio donde van a vivir los gastos compartidos con tu gente.
          Después vas a poder invitar al resto con un enlace.
        </p>

        <form onSubmit={manejarEnvio}>
          <label className="campo">Nombre del grupo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Depto Palermo"
            required
            autoFocus
          />

          {error && <p className="ayuda-error">{error}</p>}

          <button type="submit" className="btn bloque" style={{ marginTop: 14 }} disabled={creando}>
            {creando ? "Creando..." : "Crear grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}
