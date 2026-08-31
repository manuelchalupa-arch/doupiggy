// components/SettlementPanel.jsx
// Pestaña Resumen: quién le debe a quién y cuánto.
//   1. Resumen del grupo: saldo neto de cada miembro (a favor / debe).
//   2. "Estado actual": informe PDF (botón) con la liquidación completa —
//      resumen, matriz de quién debe a quién y pagos pendientes (la matriz
//      vive adentro del informe, generado por services/reportService.js).
//   3. Para saldar: a quién hay que pagarle y cuánto (un pago por par).
// Debajo sigue el generador de informes por rango de fechas (Excel/PDF).
//
// Recibe el prop `pagos` (pagos confirmados como recibidos): lo que el
// acreedor ya cobró se descuenta de la liquidación, así el Resumen muestra
// siempre lo que efectivamente falta pagar.
//
// Los datos salen de utils/calcularDeudas.js, pura y testeable. Avatares:
// círculos con la inicial (no hay foto por miembro acá), coloreados por uid.

import { useMemo, useState } from "react";
import { generarInformeExcel, generarInformePdf, generarInformeEstado } from "../services/reportService";
import { formatoARS } from "../utils/format";
import { calcularDeudas } from "../utils/calcularDeudas";
import { IconoCalendar, IconoPdf, IconoExcel } from "./IconosRaster";
import CalendarioRango from "./CalendarioRango";

const COLORES_INICIAL = [
  "#C1442D", "#5C7A3D", "#2E7D74", "#B5384C",
  "#7A5C3D", "#4B63B5", "#8C4B9E", "#3D6B9E",
];

function colorDeUid(uid) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return COLORES_INICIAL[h % COLORES_INICIAL.length];
}

function inicialDe(nombre) {
  return (nombre || "?").trim().charAt(0).toUpperCase();
}

function primeraPalabra(nombre) {
  return (nombre || "").split(/\s+/)[0];
}

/** Círculo con la inicial de un miembro, color fijo por uid. */
export function InicialMiembro({ uid, nombre, tamano = 26 }) {
  return (
    <span
      className="inicial-circulo"
      style={{ width: tamano, height: tamano, background: colorDeUid(uid), fontSize: tamano * 0.5 }}
      aria-hidden="true"
    >
      {inicialDe(nombre)}
    </span>
  );
}

/** Flecha de flujo (SVG inline): del que paga hacia quien cobra. */
function FlechaLiquidacion() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" style={{ flex: "none", opacity: 0.85 }}>
      <path
        d="M4 10 H16 M12 6 L16 10 L12 14"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 * @param {Array} [props.pagos] - pagos confirmados como recibidos
 */
export default function SettlementPanel({ uidActual, miembros, gastos, pagos = [] }) {
  const { pares, resumen } = useMemo(
    () => calcularDeudas(gastos, miembros, pagos),
    [gastos, miembros, pagos]
  );
  const [mensajeEstado, setMensajeEstado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rangoDesde, setRangoDesde] = useState(null);
  const [rangoHasta, setRangoHasta] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const nombrePorUid = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return mapa;
  }, [miembros]);

  const hayDeuda = pares.length > 0;
  const totalGeneral = pares.reduce((acc, p) => acc + p.monto, 0);

  function generarEstado() {
    try {
      const cantidad = generarInformeEstado(gastos, miembros, pagos);
      setMensajeEstado(
        cantidad > 0
          ? `Estado generado: ${cantidad} pago${cantidad === 1 ? "" : "s"} pendiente${cantidad === 1 ? "" : "s"}.`
          : "Todo saldado: el informe muestra cuentas en cero."
      );
    } catch (err) {
      setMensajeEstado(err.message);
    }
  }

  function generar(formato) {
    if (!rangoDesde) return;
    const hasta = rangoHasta ?? rangoDesde;
    const generador = formato === "pdf" ? generarInformePdf : generarInformeExcel;
    try {
      const cantidad = generador(gastos, nombrePorUid, rangoDesde, hasta);
      setModalAbierto(false);
      setMensaje(
        cantidad > 0 ? `Informe ${formato.toUpperCase()} generado (${cantidad} gastos)` : "No hubo gastos en ese rango"
      );
    } catch (err) {
      setMensaje(err.message);
    }
  }

  return (
    <>
      {/* ---------- 1. RESUMEN DEL GRUPO ---------- */}
      <div className="tarjeta-flotante">
        <h2>Resumen del grupo</h2>

        {!hayDeuda && (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--avocado)" }}>
            ¡Todo saldado! No hay deudas pendientes entre integrantes.
          </p>
        )}

        <div className="grid-resumen">
          {miembros.map((m) => {
            const r = resumen[m.uid];
            const esVos = m.uid === uidActual;
            return (
              <div key={m.uid} className="chip-resumen">
                <div className="chip-nombre">
                  <InicialMiembro uid={m.uid} nombre={m.nombre} />
                  <span>{esVos ? `${m.nombre} (vos)` : m.nombre}</span>
                </div>
                {r.neto > 0.01 ? (
                  <span className="chip-monto pos">Le deben {formatoARS.format(r.neto)}</span>
                ) : r.neto < -0.01 ? (
                  <span className="chip-monto neg">Debe {formatoARS.format(-r.neto)}</span>
                ) : (
                  <span className="chip-monto neutro">Saldado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- 2. INFORME (estado actual + rango de fechas) ---------- */}
      <div className="tarjeta tarjeta-imagen-completa">
        <div className="tarjeta-imagen-completa-panel" style={{ gap: 10, display: "flex", flexDirection: "column" }}>
          <h2>Informe</h2>
          <button
            type="button"
            className="btn accion bloque"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={generarEstado}
          >
            <IconoPdf tamano={16} />
            Estado actual
          </button>
          {mensajeEstado && <p className="ayuda-error" style={{ color: "var(--avocado)" }}>{mensajeEstado}</p>}
          <button
            type="button"
            className="btn accion bloque"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => setModalAbierto(true)}
          >
            <IconoCalendar tamano={16} />
            Generar informe
          </button>
          {mensaje && <p className="ayuda-error" style={{ color: "var(--avocado)" }}>{mensaje}</p>}
        </div>

        {modalAbierto && (
          <div className="modal-fondo" onClick={() => setModalAbierto(false)}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Elegí el rango del informe" onClick={(e) => e.stopPropagation()}>
              <h3>Elegí el rango del informe</h3>
              <CalendarioRango
                desde={rangoDesde}
                hasta={rangoHasta}
                onCambiarRango={(d, h) => {
                  setRangoDesde(d);
                  setRangoHasta(h);
                }}
              />
              <div className="modal-acciones">
                <button type="button" className="btn chico secundario" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn chico accion"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => generar("excel")}
                  disabled={!rangoDesde}
                >
                  <IconoExcel tamano={14} />
                  Excel
                </button>
                <button
                  type="button"
                  className="btn chico accion"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => generar("pdf")}
                  disabled={!rangoDesde}
                >
                  <IconoPdf tamano={14} />
                  PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------- 3. A QUIÉN HAY QUE PAGARLE ---------- */}
      <div className="tarjeta-flotante">
        <h2>A quién hay que pagarle</h2>

        {!hayDeuda ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--avocado)", margin: 0 }}>
            Todos al día: nadie debe pagar nada.
          </p>
        ) : (
          <>
            <p className="leyenda-matriz">
              Un pago por pareja (los cruzados ya quedaron compensados). El dinero
              fluye siempre del que debe hacia el que cobra.
            </p>
            <div className="lista-pagos">
              {pares.map((p) => (
                <div key={`${p.de}-${p.para}`} className="pago-fila">
                  <span className="quien">
                    <InicialMiembro uid={p.de} nombre={p.deNombre} tamano={24} />
                    <span className="nombre" title={p.deNombre}>
                      {primeraPalabra(p.deNombre)}
                      {p.de === uidActual && " (vos)"}
                    </span>
                  </span>
                  <FlechaLiquidacion />
                  <span className="pago-monto">{formatoARS.format(p.monto)}</span>
                  <FlechaLiquidacion />
                  <span className="quien" style={{ textAlign: "right", justifyContent: "flex-end" }}>
                    <span className="nombre" title={p.paraNombre}>
                      {primeraPalabra(p.paraNombre)}
                      {p.para === uidActual && " (vos)"}
                    </span>
                    <InicialMiembro uid={p.para} nombre={p.paraNombre} tamano={24} />
                  </span>
                </div>
              ))}
            </div>
            <p className="leyenda-matriz" style={{ marginTop: 10, marginBottom: 0 }}>
              Total del grupo: <strong>{formatoARS.format(totalGeneral)}</strong> en pagos pendientes.
            </p>
          </>
        )}
</div>
    </>
  );
}