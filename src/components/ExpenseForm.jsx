// components/ExpenseForm.jsx
// Pestaña Gastos completa: alta de gastos, historial de los últimos 4 con
// scroll y borrado, y el generador de informes.
//
// Etapa 4 (rediseño): íconos funcionales reemplazados por SVG inline
// (IconosRaster.jsx) en vez de PNGs externos.

import { useMemo, useState } from "react";
import {
  crearGasto,
  eliminarGasto,
  calcularDivisionIgualitaria,
} from "../services/expenseService";
import { formatoARS } from "../utils/format";
import { IconoTrash, IconoInvitacion } from "./IconosRaster";
import InvitarGrupo from "./InvitarGrupo";

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {string} props.uidActual - uid del usuario que está cargando el gasto
 * @param {Array<{uid: string, nombre: string}>} props.miembros - miembros del grupo
 * @param {Array} props.gastos - gastos ya suscriptos por AppShell (evita un
 *   segundo listener: AppShell es el dueño de useExpenses)
 */
export default function ExpenseForm({ grupoId, uidActual, miembros, gastos }) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pagadoPor, setPagadoPor] = useState(uidActual);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState(
    miembros.map((m) => m.uid)
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [invitarAbierto, setInvitarAbierto] = useState(false);

  const ultimosCuatro = gastos.slice(0, 4);

  const montoNumerico = parseFloat(monto.replace(",", ".")) || 0;

  const previewDivision = useMemo(() => {
    if (!montoNumerico || !participantesSeleccionados.length) return {};
    return calcularDivisionIgualitaria(montoNumerico, participantesSeleccionados);
  }, [montoNumerico, participantesSeleccionados]);

  function alternarParticipante(uid) {
    setParticipantesSeleccionados((prev) =>
      prev.includes(uid) ? prev.filter((p) => p !== uid) : [...prev, uid]
    );
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await crearGasto(grupoId, {
        monto: montoNumerico,
        descripcion,
        pagadoPor,
        participantes: participantesSeleccionados,
        creadoPor: uidActual,
      });
      setMonto("");
      setDescripcion("");
      setParticipantesSeleccionados(miembros.map((m) => m.uid));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarBorrado(gasto) {
    const confirmar = window.confirm(
      `¿Borrar el gasto "${gasto.descripcion}" (${formatoARS.format(gasto.monto)})? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;
    await eliminarGasto(grupoId, gasto.id);
  }

  function nombreDe(uid) {
    return miembros.find((m) => m.uid === uid)?.nombre ?? uid;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn chico accion"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => setInvitarAbierto(true)}
        >
          <IconoInvitacion tamano={14} />
          Invitar a este grupo
        </button>
      </div>

      <div className="tarjeta tarjeta-imagen-completa">
        <div className="tarjeta-imagen-completa-panel">
        <form onSubmit={manejarEnvio}>
          <label className="campo">Monto (ARS)</label>
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
            required
          />

          <label className="campo">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Supermercado"
            required
          />

          <label className="campo">Pagó</label>
          <select value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}>
            {miembros.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.nombre}
              </option>
            ))}
          </select>

          <label className="campo">Dividir entre</label>
          <div className="chips">
            {miembros.map((m) => (
              <button
                type="button"
                key={m.uid}
                className={`chip${participantesSeleccionados.includes(m.uid) ? " sel" : ""}`}
                aria-pressed={participantesSeleccionados.includes(m.uid)}
                onClick={() => alternarParticipante(m.uid)}
              >
                {m.nombre}
                {previewDivision[m.uid] != null && ` — ${formatoARS.format(previewDivision[m.uid])}`}
              </button>
            ))}
          </div>

          {error && <p className="ayuda-error">{error}</p>}

          <button type="submit" className="btn accion bloque" style={{ marginTop: 14 }} disabled={enviando}>
            {enviando ? "Guardando..." : "Agregar gasto"}
          </button>
        </form>
        </div>
      </div>

      <div className="tarjeta">
        <div className="lista-historial">
          {ultimosCuatro.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, opacity: 0.7 }}>
              Todavía no hay gastos cargados.
            </p>
          )}
          {ultimosCuatro.map((g) => (
            <div className="item-gasto" key={g.id}>
              <IconoRecibo />
              <div className="texto-gasto">
                <div className="desc">{g.descripcion}</div>
                <div className="meta">Pagó {nombreDe(g.pagadoPor)}</div>
              </div>
              <div className="monto">{formatoARS.format(g.monto)}</div>
              <button
                className="btn-borrar"
                aria-label="Borrar gasto"
                onClick={() => manejarBorrado(g)}
              >
                <IconoTrash tamano={14} prohibido />
              </button>
            </div>
          ))}
        </div>
      </div>

      {invitarAbierto && (
        <div className="modal-fondo" onClick={() => setInvitarAbierto(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Invitá a este grupo" onClick={(e) => e.stopPropagation()}>
            <h3>Invitá a este grupo</h3>
            <InvitarGrupo grupoId={grupoId} uidActual={uidActual} />
            <div className="modal-acciones">
              <button type="button" className="btn chico secundario" onClick={() => setInvitarAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Pequeño recibo dibujado (SVG inline, estilo rubber-hose). */
function IconoRecibo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="icono-renglon">
      <path
        d="M6 3 H18 V21 L15.5 19 L13 21 L10.5 19 L8 21 L6 19 Z M8.5 8 H15.5 M8.5 12 H15.5 M8.5 16 H12.5"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

