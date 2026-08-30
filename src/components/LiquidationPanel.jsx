// components/LiquidationPanel.jsx
// Pestaña Liquidación: gestionar y confirmar los pagos pendientes.
//   - Lista "lo que te tienen que pagar": un pago por cada deudor que te
//     debe (derivado de utils/calcularDeudas.js).
//   - Tilde circular por fila: tildar = confirmar que recibiste ese pago
//     (se guarda en /grupos/{id}/pagos vía pagoService); destildar lo
//     revierte y queda pendiente de nuevo.
//   - "Cerrar liquidación": habilita cuando ya marcaste todos los pagos y
//     deja un snapshot histórico (cerradoPor / cerradoEn / recibidos).
//
// Los montos pendientes se recalculan solos: en cuanto confirmás un pago,
// la deuda del par se descuenta y este panel (y el Resumen / el Inicio)
// muestran lo que falta.

import { useMemo, useState } from "react";
import { formatoARS } from "../utils/format";
import { calcularDeudas } from "../utils/calcularDeudas";
import {
  marcarPagoRecibido,
  desmarcarPagoRecibido,
  cerrarLiquidacion,
} from "../services/pagoService";
import { InicialMiembro } from "./SettlementPanel";

function primeraPalabra(nombre) {
  return (nombre || "").split(/\s+/)[0];
}

// Traduce el error de Firestore a un mensaje accionable: el caso típico es
// que las reglas nuevas (subcolecciones /pagos y /liquidaciones) todavía no
// se publicaron en Firebase Console y la escritura cae con permission-denied.
function mensajeDeError(err) {
  const code = err?.code || "";
  if (code === "permission-denied" || code === "PERMISSION_DENIED") {
    return "Sin permisos para guardar: publicá las reglas nuevas de Firestore " +
      "(subcolecciones /pagos y /liquidaciones) en Firebase Console y volvé a intentar.";
  }
  return err?.message || "No se pudo actualizar el pago.";
}

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.gastos
 * @param {Array} [props.pagos] - pagos confirmados como recibidos
 */
export default function LiquidationPanel({ grupoId, uidActual, miembros, gastos, pagos = [] }) {
  // "procesando" guarda la fila que está en vuelo (de) o "cerrar", y evita
  // que se dispare dos veces el mismo toggle mientras la escritura está en
  // curso en Firestore.
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // La liquidación ya viene descontada: los pares de acá son lo pendiente.
  const { pares } = useMemo(
    () => calcularDeudas(gastos, miembros, pagos),
    [gastos, miembros, pagos]
  );

  const nombreDe = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return (uid) => mapa[uid] ?? uid;
  }, [miembros]);

  // Una fila por deudor que te debe, combinando lo pendiente (derivado de
  // los gastos) con lo ya recibido (confirmado en la base). Se guarda la
  // lista completa de registros (pagos[]) porque puede haber más de uno por
  // deudor si el par creció y se marcó en dos tandas.
  const filas = useMemo(() => {
    const porDeudor = new Map();
    for (const p of pares) {
      if (p.para !== uidActual) continue;
      const f = porDeudor.get(p.de) || { de: p.de, pendiente: 0, recibido: 0, pagos: [] };
      f.pendiente = Math.round((f.pendiente + p.monto) * 100) / 100;
      porDeudor.set(p.de, f);
    }
    for (const pg of pagos) {
      if (pg.para !== uidActual) continue;
      const f = porDeudor.get(pg.de) || { de: pg.de, pendiente: 0, recibido: 0, pagos: [] };
      f.recibido = Math.round((f.recibido + pg.monto) * 100) / 100;
      f.pagos.push(pg);
      porDeudor.set(pg.de, f);
    }
    return [...porDeudor.values()].map((f) => ({
      ...f,
      pagos: f.pagos.sort((a, b) => (a.id || "").localeCompare(b.id || "")),
    }));
  }, [pares, pagos, uidActual]);

  const totalPendiente = filas.reduce((acum, f) => acum + f.pendiente, 0);
  const totalRecibido = filas.reduce((acum, f) => acum + f.recibido, 0);
  const todoRecibido = filas.every((f) => f.pendiente <= 0.01);
  const recibidosDeUno = pagos.filter((p) => p.para === uidActual);

  async function alternar(fila) {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando(fila.de);
    try {
      if (fila.pagos.length > 0) {
        // Desmarcar: borra TODOS los registros de ese deudor, no solo el
        // último — así el pago vuelve completo a pendiente.
        await Promise.all(fila.pagos.map((p) => desmarcarPagoRecibido(grupoId, p.id)));
      } else if (fila.pendiente > 0.01) {
        await marcarPagoRecibido(grupoId, { de: fila.de, para: uidActual, monto: fila.pendiente });
      }
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  async function cerrar() {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando("cerrar");
    try {
      await cerrarLiquidacion(grupoId, uidActual, {
        total: totalRecibido,
        recibidos: recibidosDeUno.map((p) => ({
          de: p.de,
          deNombre: nombreDe(p.de),
          para: p.para,
          monto: p.monto,
          confirmadoEn: p.confirmadoEn ?? null,
        })),
      });
      setMensaje(
        recibidosDeUno.length
          ? `Liquidación cerrada: ${recibidosDeUno.length} pago${recibidosDeUno.length === 1 ? "" : "s"} recibido${recibidosDeUno.length === 1 ? "" : "s"}.`
          : "Liquidación cerrada: no había pagos pendientes."
      );
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  return (
    <>
      {/* ---------- 1. LO QUE TENÉS QUE COBRAR ---------- */}
      <div className="tarjeta-flotante">
        <h2>Pagos pendientes</h2>
        <p className="leyenda-matriz">
          Tildá cada pago que efectivamente recibiste: se descuenta solo de los
          saldos y queda registrado. Destildar lo vuelve a dejar pendiente.
        </p>

        {error && <p className="ayuda-error">{error}</p>}

        {filas.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--avocado)" }}>
            No tenés pagos pendientes: no hay nada que cobrar por ahora.
          </p>
        ) : (
          <div className="lista-pagos">
            {filas.map((f) => {
              const recibido = f.pendiente <= 0.01;
              const enProceso = procesando === f.de;
              return (
                <div className={`pago-fila${enProceso ? " procesando" : ""}`} key={f.de}>
                  <button
                    type="button"
                    className={`pago-check${recibido ? " recibido" : ""}`}
                    onClick={() => alternar(f)}
                    disabled={procesando !== null}
                    aria-pressed={recibido}
                    title={recibido ? "Desmarcar: vuelve a quedar pendiente" : "Marcar como recibido"}
                  >
                    ✓
                  </button>
                  <span className="quien">
                    <InicialMiembro uid={f.de} nombre={nombreDe(f.de)} tamano={24} />
                    <span className="nombre" title={nombreDe(f.de)}>
                      {primeraPalabra(nombreDe(f.de))}
                    </span>
                  </span>
                  <div className="pago-detalle">
                    <span className="pago-detalle-monto">
                      {formatoARS.format(f.recibido + f.pendiente)}
                      {f.pendiente > 0.01 && f.recibido > 0
                        ? ` (recibí ${formatoARS.format(f.recibido)})`
                        : ""}
                    </span>
                    <span className={`pago-estado ${recibido ? "recibido" : "pendiente"}`}>
                      {recibido ? "Recibido" : "Pendiente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filas.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <span className="chip-resumen">
              <span className="chip-nombre">Pendiente</span>
              <span className="chip-monto pos">{formatoARS.format(totalPendiente)}</span>
            </span>
            <span className="chip-resumen">
              <span className="chip-nombre">Recibido</span>
              <span className="chip-monto">{formatoARS.format(totalRecibido)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ---------- 2. CERRAR LIQUIDACIÓN ---------- */}
      <div className="tarjeta tarjeta-imagen-completa">
        <div className="tarjeta-imagen-completa-panel">
          <h2>Cerrar liquidación</h2>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
            {todoRecibido
              ? "Todo confirmado. Se guarda un cierre con los pagos recibidos y el histórico queda registrado."
              : "Confirmá todos los pagos como recibidos para poder cerrar la liquidación."}
          </p>
          <button
            type="button"
            className="btn principal bloque"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={cerrar}
            disabled={procesando !== null || !todoRecibido}
          >
            Cerrar liquidación
          </button>
          {mensaje && <p className="ayuda-error" style={{ color: "var(--avocado)" }}>{mensaje}</p>}
          {error && <p className="ayuda-error">{error}</p>}
        </div>
      </div>
    </>
  );
}