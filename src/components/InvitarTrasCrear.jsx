// components/InvitarTrasCrear.jsx
// Pantalla completa que se interpone entre "grupo creado" y AppShell,
// para que invitar sea el paso inmediato siguiente a crear el grupo.

import InvitarGrupo from "./InvitarGrupo";

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {string} props.uidActual
 * @param {() => void} props.onContinuar
 */
export default function InvitarTrasCrear({ grupoId, uidActual, onContinuar }) {
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
      <div className="tarjeta" style={{ width: "100%", maxWidth: 360 }}>
        <h2>Invitá a tu gente</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          Generá un enlace y compartilo — quien lo abra inicia sesión con su
          propia cuenta de Google y queda sumado a este grupo, sin perder
          sus otros grupos.
        </p>

        <InvitarGrupo grupoId={grupoId} uidActual={uidActual} />

        <button type="button" className="btn secundario bloque" style={{ marginTop: 12 }} onClick={onContinuar}>
          Ahora no, continuar
        </button>
      </div>
    </div>
  );
}
