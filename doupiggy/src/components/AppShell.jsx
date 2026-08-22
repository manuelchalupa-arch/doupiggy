// components/AppShell.jsx
// Conecta los hooks reales (useExpenses, useLoans) con las tres pestañas y
// controla la navegación + el header dinámico. Punto de entrada visual de
// la app una vez pasado el splash y con un grupo ya seleccionado.

import { useMemo, useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { useLoans } from "../hooks/useLoans";
import HomeSummary from "./HomeSummary";
import ExpenseForm from "./ExpenseForm";
import SettlementPanel from "./SettlementPanel";
import LoanManager from "./LoanManager";
import InfoProfile from "./InfoProfile";

const TITULOS = {
  inicio: ["Inicio", "Así viene la cuerda esta semana"],
  gastos: ["Gastos", "Cargá y revisá lo último"],
  info: ["Información", "Tu perfil y tus informes"],
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
  const { gastos } = useExpenses(grupoId);
  const { prestamos } = useLoans(grupoId);

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
        <h1>{tituloTab}</h1>
        <p>{subtituloTab}</p>
        {grupos.length > 1 && (
          <select
            value={grupoId}
            onChange={(e) => onCambiarGrupo?.(e.target.value)}
            style={{ position: "relative", zIndex: 1, marginTop: 8, width: "auto", fontSize: 12, padding: "4px 8px" }}
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        )}
      </header>

      <main className="contenido-tab">
        {tab === "inicio" && (
          <HomeSummary
            grupo={grupo}
            gastos={gastos}
            miembros={miembros}
            uidActual={uidActual}
          />
        )}

        {tab === "gastos" && (
          <>
            <ExpenseForm
              grupoId={grupoId}
              uidActual={uidActual}
              miembros={miembros}
            />
            <SettlementPanel gastos={gastos} miembros={miembros} />
            <LoanManager
              grupoId={grupoId}
              uidActual={uidActual}
              miembros={miembros}
              prestamos={prestamos}
            />
          </>
        )}

        {tab === "info" && (
          <InfoProfile
            uidActual={uidActual}
            perfil={perfil}
            grupoId={grupoId}
            gastos={gastos}
          />
        )}
      </main>

      <nav className="tabbar">
        <TabButton activo={tab === "inicio"} onClick={() => setTab("inicio")} label="Inicio">
          <path d="M4 12 L12 5 L20 12 M6 11 V19 H18 V11" stroke="#3A2317" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </TabButton>
        <TabButton activo={tab === "gastos"} onClick={() => setTab("gastos")} label="Gastos">
          <circle cx="12" cy="12" r="9" stroke="#3A2317" strokeWidth="2" fill="none" />
          <path d="M12 7 V17 M7 12 H17" stroke="#3A2317" strokeWidth="2" strokeLinecap="round" />
        </TabButton>
        <TabButton activo={tab === "info"} onClick={() => setTab("info")} label="Info">
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="#3A2317" strokeWidth="2" fill="none" />
          <circle cx="9" cy="11" r="1.6" fill="#3A2317" />
          <path d="M6.5 15.5 C7.5 13.5 10.5 13.5 11.5 15.5 M14 10 H18 M14 13 H18" stroke="#3A2317" strokeWidth="1.6" strokeLinecap="round" />
        </TabButton>
      </nav>
    </div>
  );
}

function TabButton({ activo, onClick, label, children }) {
  return (
    <button className={`tab-btn${activo ? " activo" : ""}`} onClick={onClick}>
      <svg viewBox="0 0 24 24">
        <rect className="icon-bg" x="1" y="1" width="22" height="22" rx="6" fill="none" />
        {children}
      </svg>
      {label}
    </button>
  );
}
