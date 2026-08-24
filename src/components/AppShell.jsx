// components/AppShell.jsx
// Conecta los hooks reales con las 4 pestañas: Inicio, Gastos (con
// generador de informes incluido), Liquidación (separada) e Información.
// La pestaña de Préstamos se eliminó de la navegación por pedido explícito
// (el servicio y componente de préstamos siguen en el repo por si se
// quiere reactivar más adelante, pero no se renderizan).

import { useMemo, useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import HomeSummary from "./HomeSummary";
import ExpenseForm from "./ExpenseForm";
import SettlementPanel from "./SettlementPanel";
import InfoProfile from "./InfoProfile";
import InvitarGrupo from "./InvitarGrupo";

const TITULOS = {
  inicio: ["Inicio", "Así viene la cuerda esta semana"],
  gastos: ["Gastos", "Cargá, revisá e informá"],
  liquidacion: ["Liquidación", "Quién le paga a quién"],
  info: ["Información", "Tu perfil y tus grupos"],
};

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {object} props.grupo - documento del grupo ({ nombre, miembros, miembrosInfo, ... })
 * @param {string} props.uidActual
 * @param {object} props.perfil - documento de /usuarios del usuario actual
 * @param {Array} [props.grupos] - todos los grupos del usuario (para el selector)
 * @param {(id: string) => void} [props.onCambiarGrupo]
 */
export default function AppShell({ grupoId, grupo, uidActual, perfil, grupos = [], onCambiarGrupo }) {
  const [tab, setTab] = useState("inicio");
  const [invitarAbierto, setInvitarAbierto] = useState(false);
  const { gastos } = useExpenses(grupoId);

  const miembros = useMemo(() => {
    if (!grupo?.miembrosInfo) return [];
    return Object.entries(grupo.miembrosInfo).map(([uid, info]) => ({
      uid,
      nombre: info.nombre,
    }));
  }, [grupo]);

  const [tituloTab, subtituloTab] = TITULOS[tab];

  return (
    <div>
      <header className="app-header">
        <div className="rayos" />
        <div className="titulo-wrap">
          <h1>{tituloTab}</h1>
          <p>{subtituloTab}</p>
          {grupos.length > 1 && (
            <select
              value={grupoId}
              onChange={(e) => onCambiarGrupo?.(e.target.value)}
              style={{ marginTop: 8, width: "auto", fontSize: 12, padding: "4px 8px" }}
            >
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="acciones-header">
          <button type="button" className="btn chico" onClick={() => setInvitarAbierto(true)}>
            Invitar
          </button>
        </div>
      </header>

      <main className="contenido-tab">
        {tab === "inicio" && (
          <HomeSummary grupo={grupo} gastos={gastos} miembros={miembros} uidActual={uidActual} />
        )}

        {tab === "gastos" && (
          <ExpenseForm grupoId={grupoId} uidActual={uidActual} miembros={miembros} gastos={gastos} />
        )}

        {tab === "liquidacion" && <SettlementPanel gastos={gastos} miembros={miembros} />}

        {tab === "info" && (
          <InfoProfile uidActual={uidActual} perfil={perfil} grupoId={grupoId} miembros={miembros} />
        )}
      </main>

      <nav className="tabbar">
        <TabButton activo={tab === "inicio"} onClick={() => setTab("inicio")} label="Inicio">
          <path d="M4 12 L12 5 L20 12 M6 11 V19 H18 V11" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </TabButton>
        <TabButton activo={tab === "gastos"} onClick={() => setTab("gastos")} label="Gastos">
          <circle cx="12" cy="12" r="9" strokeWidth="2" fill="none" />
          <path d="M12 7 V17 M7 12 H17" strokeWidth="2" strokeLinecap="round" />
        </TabButton>
        <TabButton activo={tab === "liquidacion"} onClick={() => setTab("liquidacion")} label="Liquidación">
          <path d="M12 3 V21 M6 7 H18 M6 7 L3 13 A3 3 0 0 0 9 13 L6 7 M18 7 L15 13 A3 3 0 0 0 21 13 L18 7" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </TabButton>
        <TabButton activo={tab === "info"} onClick={() => setTab("info")} label="Info">
          <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="2" fill="none" />
          <circle cx="9" cy="11" r="1.6" fill="currentColor" stroke="none" />
          <path d="M6.5 15.5 C7.5 13.5 10.5 13.5 11.5 15.5 M14 10 H18 M14 13 H18" strokeWidth="1.6" strokeLinecap="round" />
        </TabButton>
      </nav>

      {invitarAbierto && (
        <div className="modal-fondo" onClick={() => setInvitarAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invitá a tu gente</h3>
            <InvitarGrupo grupoId={grupoId} uidActual={uidActual} />
            <div className="modal-acciones">
              <button type="button" className="btn chico secundario" onClick={() => setInvitarAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ activo, onClick, label, children }) {
  return (
    <button className={`tab-btn${activo ? " activo" : ""}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none">
        <rect className="icon-bg" x="1" y="1" width="22" height="22" rx="6" fill="none" />
        {children}
      </svg>
      {label}
    </button>
  );
}
