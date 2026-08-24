// components/ExpenseForm.jsx
// Pestaña Gastos completa: alta de gastos, historial de los últimos 4 con
// scroll y borrado, y el generador de informes (antes vivía en la pestaña
// de Información, ahora está acá porque es donde tiene más sentido).

import { useMemo, useState } from "react";
import {
  crearGasto,
  eliminarGasto,
  calcularDivisionIgualitaria,
} from "../services/expenseService";
import { generarInformeExcel, generarInformePdf } from "../services/reportService";
import { useExpenses } from "../hooks/useExpenses";
import { backgroundAssets, iconAssets } from "../assets";
import { formatoARS } from "../utils/format";
import CalendarioRango from "./CalendarioRango";

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {string} props.uidActual - uid del usuario que está cargando el gasto
 * @param {Array<{uid: string, nombre: string}>} props.miembros - miembros del grupo
 */
export default function ExpenseForm({ grupoId, uidActual, miembros }) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pagadoPor, setPagadoPor] = useState(uidActual);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState(
    miembros.map((m) => m.uid)
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // El historial visible sale de la misma suscripción en tiempo real que
  // usa el resto de la app: mantenemos una sola fuente de verdad.
  const { gastos } = useExpenses(grupoId);
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

  async function manejarBorrado(gastoId) {
    await eliminarGasto(grupoId, gastoId);
  }

  function nombreDe(uid) {
    return miembros.find((m) => m.uid === uid)?.nombre ?? uid;
  }

  return (
    <>
      <div
        className="tarjeta"
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundImage: `url(${backgroundAssets.form})`,
          backgroundSize: "180px",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
          backgroundBlendMode: "luminosity",
        }}
      >
        <span className="etiqueta">Nuevo gasto</span>
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
              <div
                key={m.uid}
                className={`chip${participantesSeleccionados.includes(m.uid) ? " sel" : ""}`}
                onClick={() => alternarParticipante(m.uid)}
              >
                {m.nombre}
                {previewDivision[m.uid] != null && ` — ${formatoARS.format(previewDivision[m.uid])}`}
              </div>
            ))}
          </div>

          {error && <p className="ayuda-error">{error}</p>}

          <button type="submit" className="btn bloque" style={{ marginTop: 14 }} disabled={enviando}>
            {enviando ? "Guardando..." : "Agregar gasto"}
          </button>
        </form>
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Historial</span>
        <h2>Últimos 4 gastos</h2>
        <div className="lista-historial">
          {ultimosCuatro.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--burnt)", fontWeight: 600 }}>
              Todavía no hay gastos cargados.
            </p>
          )}
          {ultimosCuatro.map((g) => (
            <div className="item-gasto" key={g.id}>
              <div style={{ minWidth: 0 }}>
                <div className="desc">{g.descripcion}</div>
                <div className="meta">Pagó {nombreDe(g.pagadoPor)}</div>
              </div>
              <div className="monto">{formatoARS.format(g.monto)}</div>
              <button
                className="btn-borrar"
                aria-label="Borrar gasto"
                onClick={() => manejarBorrado(g.id)}
              >
                <img src={iconAssets.trash} alt="" className="icono-inline" style={{ "--icon-size": "14px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <GeneradorInformes gastos={gastos} miembros={miembros} uidActual={uidActual} />
    </>
  );
}

/** Generador de informes (antes en Información, ahora vive en Gastos). */
function GeneradorInformes({ gastos, miembros, uidActual }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rangoDesde, setRangoDesde] = useState(null);
  const [rangoHasta, setRangoHasta] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const nombrePorUid = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return mapa;
  }, [miembros]);

  function generar(formato) {
    if (!rangoDesde) return;
    const hasta = rangoHasta ?? rangoDesde;
    const generador = formato === "pdf" ? generarInformePdf : generarInformeExcel;
    try {
      const cantidad = generador(gastos, nombrePorUid, rangoDesde, hasta);
      setModalAbierto(false);
      setMensaje(cantidad > 0 ? `Informe ${formato.toUpperCase()} generado (${cantidad} gastos)` : "No hubo gastos en ese rango");
    } catch (err) {
      setMensaje(err.message);
    }
  }

  return (
    <div
      className="tarjeta"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url(${backgroundAssets.report})`,
        backgroundSize: "150px",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom right",
        backgroundBlendMode: "luminosity",
      }}
    >
      <span className="etiqueta">Informes</span>
      <h2>Descargá tus gastos</h2>
      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
        Elegí un rango de fechas del calendario.
      </p>
      <button
        type="button"
        className="btn secundario bloque"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => setModalAbierto(true)}
      >
        <img src={iconAssets.calendar} alt="" className="icono-inline" style={{ "--icon-size": "16px" }} />
        Generar informe
      </button>
      {mensaje && <p className="ayuda-error" style={{ color: "var(--avocado)" }}>{mensaje}</p>}

      {modalAbierto && (
        <div className="modal-fondo" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                className="btn chico"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => generar("excel")}
                disabled={!rangoDesde}
              >
                <img src={iconAssets.excel} alt="" className="icono-inline" style={{ "--icon-size": "14px" }} />
                Excel
              </button>
              <button
                type="button"
                className="btn chico"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => generar("pdf")}
                disabled={!rangoDesde}
              >
                <img src={iconAssets.pdf} alt="" className="icono-inline" style={{ "--icon-size": "14px" }} />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
