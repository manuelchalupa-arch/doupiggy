// components/CrearGrupoScreen.jsx
// Se muestra cuando el usuario ya inició sesión pero todavía no es miembro
// de ningún grupo (típicamente: primer login). Tras crear el grupo, NO pasa
// directo a AppShell: llama a onCreado(grupoId) para que App.jsx muestre
// primero la pantalla de invitar, y recién después pasa a AppShell.
// También se reutiliza desde el botón "Nuevo grupo" del header (creando un
// grupo ADICIONAL): en ese caso App.jsx pasa `adicional`, cambia el título
// y ofrece onCancelar para volver sin crear nada.

import { useState } from "react";
import { crearGrupo } from "../services/groupService";
import { brandingAssets } from "../assets";
import { IconoCrearGrupo } from "./IconosRaster";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {object} props.usuarioAuth - objeto de Firebase Auth (para nombre/foto)
 * @param {(grupoId: string) => void} props.onCreado
 * @param {boolean} [props.adicional] - true cuando se crea un grupo ADICIONAL
 *   (ya hay otros), no el primero.
 * @param {() => void} [props.onCancelar] - vuelve atrás sin crear (solo en
 *   el flujo "nuevo grupo adicional").
 */
export default function CrearGrupoScreen({ uidActual, usuarioAuth, onCreado, adicional = false, onCancelar }) {
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
        justifyContent: "flex-start",
        padding: "40px 24px 24px",
        gap: 20,
      }}
    >
      <img
        src={brandingAssets.crearGrupoLogo}
        alt="DouPiggy"
        style={{ width: "100%", maxWidth: 480, height: "auto", objectFit: "contain", flex: "none" }}
      />

      <div className="tarjeta" style={{ width: "100%", maxWidth: 360 }}>
        {onCancelar && (
          <button
            type="button"
            className="btn chico"
            onClick={onCancelar}
            style={{ marginBottom: 10 }}
          >
            ← Volver
          </button>
        )}
        <h2>{adicional ? "Crear un grupo nuevo" : "Creá tu primer grupo"}</h2>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {adicional
            ? "Vas a tener un espacio nuevo para organizar otros gastos compartidos. Después vas a poder invitar al resto con un enlace."
            : "Es el espacio donde van a vivir los gastos compartidos con tu gente. Después vas a poder invitar al resto con un enlace."}
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

          <button
            type="submit"
            className="btn accion bloque"
            style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            disabled={creando}
          >
            <IconoCrearGrupo tamano={16} />
            {creando ? "Creando..." : "Crear grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}
