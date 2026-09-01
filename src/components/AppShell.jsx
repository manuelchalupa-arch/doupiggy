// components/AppShell.jsx
// Header "cartel" (logo animado + nombre a la izquierda, cartel de madera
// con el grupo activo a la derecha) + las 5 pestañas, cada una envuelta en
// FondoEscena para que el escenario ilustrado correspondiente al saldo se
// vea en TODAS. El nivel se calcula una sola vez acá (utils/nivelSaldo) y
// se pasa hacia abajo.
//
// Pestañas: Inicio (resumen visual + saldo), Gastos (alta/edición),
// Resumen (quién le debe a quién, exporta informes), Liquidación (gestión
// personal de pagos declarados/confirmados) e Info (grupo, perfil).
// Lógicamente, "Liquidación" gestiona los pagos confirmados en la base
// (services/pagoService) y "Resumen" muestra el estado descontado.
//
// En pantallas de escritorio (≥900px) la tabbar pasa de barra inferior a
// barra lateral fija — mismo componente, resuelto por CSS (ver
// .tabbar en layout.css), sin duplicar marcado.
//
// La instalación PWA vive en su propia pestaña (Info > Configuración),
// fuera de este armazón.

import { useMemo, useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { usePagos } from "../hooks/usePagos";
import { calcularSaldoUsuario, calcularNivel } from "../utils/nivelSaldo";
import AppHeader from "./AppHeader";
import FondoEscena from "./FondoEscena";
import HomeSummary from "./HomeSummary";
import ExpenseForm from "./ExpenseForm";
import SettlementPanel from "./SettlementPanel";
import LiquidationPanel from "./LiquidationPanel";
import InfoProfile from "./InfoProfile";
import {
  IconoTabInicio,
  IconoTabGastos,
  IconoTabLiquidacion,
  IconoTabPagos,
  IconoTabInfo,
} from "./IconoTab";

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
  const { gastos, error: errorGastos } = useExpenses(grupoId);
  const { pagos, error: errorPagos } = usePagos(grupoId);

  const errorDatos = errorGastos ?? errorPagos;
  const esPermisos = errorDatos?.code === "permission-denied";

  const miembros = useMemo(() => {
    if (!grupo?.miembrosInfo) return [];
    return Object.entries(grupo.miembrosInfo).map(([uid, info]) => ({
      uid,
      nombre: info.nombre,
      alias: info.alias ?? null,
      cbu: info.cbu ?? null,
      esLocal: !!info.esLocal,
    }));
  }, [grupo]);

  const saldo = useMemo(
    () => calcularSaldoUsuario(gastos, uidActual, pagos),
    [gastos, uidActual, pagos]
  );
  const nivel = useMemo(() => calcularNivel(saldo), [saldo]);

  // Íconos de pestaña personalizados por el usuario (data URL) o null =
  // usar el medallón SVG de fábrica.
  const iconosTab = perfil?.iconosTab ?? {};

  return (
    <div>
      <AppHeader tab={tab} grupoId={grupoId} grupos={grupos} onCambiarGrupo={onCambiarGrupo} />

      <main>
        <FondoEscena nivel={nivel}>
          {errorDatos && (
            <div className="tarjeta tarjeta-imagen-completa" style={{ marginBottom: 14 }}>
              <div className="tarjeta-imagen-completa-panel">
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
                  {esPermisos
                    ? "No se pudieron leer los datos: Firestore rechazó el pedido por permisos. Revisá que publicaste las reglas de seguridad (firebase/firestore.rules) en Firebase Console > Firestore Database > Rules."
                    : `Hubo un problema al leer los datos del grupo. Código: ${errorDatos?.code ?? "desconocido"}.`}{" "}
                  <button
                    type="button"
                    className="btn chico"
                    style={{ marginLeft: 6 }}
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </button>
                </p>
              </div>
            </div>
          )}

          {tab === "inicio" && (
            <HomeSummary
              gastos={gastos}
              miembros={miembros}
              uidActual={uidActual}
              pagos={pagos}
              perfil={perfil}
            />
          )}

          {tab === "gastos" && (
            <ExpenseForm grupoId={grupoId} uidActual={uidActual} miembros={miembros} gastos={gastos} />
          )}

          {tab === "liquidacion" && (
            <SettlementPanel gastos={gastos} miembros={miembros} uidActual={uidActual} pagos={pagos} />
          )}

          {tab === "pagos" && (
            <LiquidationPanel
              grupoId={grupoId}
              uidActual={uidActual}
              miembros={miembros}
              gastos={gastos}
              pagos={pagos}
            />
          )}

          {tab === "info" && (
            <InfoProfile
              uidActual={uidActual}
              perfil={perfil}
              grupoId={grupoId}
              grupos={grupos}
              onCambiarGrupo={onCambiarGrupo}
            />
          )}
        </FondoEscena>
      </main>

      <nav className="tabbar">
        <TabButton activo={tab === "inicio"} onClick={() => setTab("inicio")} label="Inicio" iconoPersonalizado={iconosTab.inicio}>
          <IconoTabInicio />
        </TabButton>
        <TabButton activo={tab === "gastos"} onClick={() => setTab("gastos")} label="Gastos" iconoPersonalizado={iconosTab.gastos}>
          <IconoTabGastos />
        </TabButton>
        <TabButton activo={tab === "liquidacion"} onClick={() => setTab("liquidacion")} label="Resumen" iconoPersonalizado={iconosTab.liquidacion}>
          <IconoTabLiquidacion />
        </TabButton>
        <TabButton activo={tab === "pagos"} onClick={() => setTab("pagos")} label="Liquidación" iconoPersonalizado={iconosTab.pagos}>
          <IconoTabPagos />
        </TabButton>
        <TabButton activo={tab === "info"} onClick={() => setTab("info")} label="Info" iconoPersonalizado={iconosTab.info}>
          <IconoTabInfo />
        </TabButton>
      </nav>
    </div>
  );
}

function TabButton({ activo, onClick, label, children, iconoPersonalizado }) {
  return (
    <button className={`tab-btn${activo ? " activo" : ""}`} onClick={onClick}>
      {iconoPersonalizado ? (
        <img src={iconoPersonalizado} alt="" className="tab-btn-icono-custom" />
      ) : (
        children
      )}
      {label}
    </button>
  );
}
