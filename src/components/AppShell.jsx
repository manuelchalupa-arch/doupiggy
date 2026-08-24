// components/AppShell.jsx
// Sin banner superior: el fondo de cada pestaña ocupa toda la pantalla
// (Inicio ya lo hacía con su imagen de nivel; el resto usa la textura de
// papel del tema, que ahora se ve completa al no estar tapada por un
// header). El selector de grupo (si el usuario tiene más de uno) vive en
// Información, no arriba. El botón de invitar vive en Gastos.

import { useMemo, useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import HomeSummary from "./HomeSummary";
import ExpenseForm from "./ExpenseForm";
import SettlementPanel from "./SettlementPanel";
import InfoProfile from "./InfoProfile";
import { IconoTabInicio, IconoTabGastos, IconoTabLiquidacion, IconoTabInfo } from "./IconoTab";

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {object} props.grupo
 * @param {string} props.uidActual
 * @param {object} props.perfil
 * @param {Array} [props.grupos]
 * @param {(id: string) => void} [props.onCambiarGrupo]
 */
export default function AppShell({ grupoId, grupo, uidActual, perfil, grupos = [], onCambiarGrupo }) {
  const [tab, setTab] = useState("inicio");
  const { gastos } = useExpenses(grupoId);

  const miembros = useMemo(() => {
    if (!grupo?.miembrosInfo) return [];
    return Object.entries(grupo.miembrosInfo).map(([uid, info]) => ({
      uid,
      nombre: info.nombre,
    }));
  }, [grupo]);

  return (
    <div>
      <main className={tab === "inicio" ? "" : "contenido-tab"} style={{ paddingTop: tab === "inicio" ? 0 : "max(18px, env(safe-area-inset-top))" }}>
        {tab === "inicio" && (
          <HomeSummary grupo={grupo} gastos={gastos} miembros={miembros} uidActual={uidActual} />
        )}

        {tab === "gastos" && (
          <ExpenseForm grupoId={grupoId} uidActual={uidActual} miembros={miembros} />
        )}

        {tab === "liquidacion" && <SettlementPanel gastos={gastos} miembros={miembros} />}

        {tab === "info" && (
          <InfoProfile
            uidActual={uidActual}
            perfil={perfil}
            grupoId={grupoId}
            grupos={grupos}
            onCambiarGrupo={onCambiarGrupo}
          />
        )}
      </main>

      <nav className="tabbar">
        <TabButton activo={tab === "inicio"} onClick={() => setTab("inicio")} label="Inicio">
          <IconoTabInicio />
        </TabButton>
        <TabButton activo={tab === "gastos"} onClick={() => setTab("gastos")} label="Gastos">
          <IconoTabGastos />
        </TabButton>
        <TabButton activo={tab === "liquidacion"} onClick={() => setTab("liquidacion")} label="Liquidación">
          <IconoTabLiquidacion />
        </TabButton>
        <TabButton activo={tab === "info"} onClick={() => setTab("info")} label="Info">
          <IconoTabInfo />
        </TabButton>
      </nav>
    </div>
  );
}

function TabButton({ activo, onClick, label, children }) {
  return (
    <button className={`tab-btn${activo ? " activo" : ""}`} onClick={onClick}>
      {children}
      {label}
    </button>
  );
}
