// components/LoanManager.jsx
// Misma lógica de préstamos/cuotas (loanService), con la identidad visual
// retro: tarjeta "sticker", chips y botones consistentes con el resto de la app.

import { useState } from "react";
import { crearPrestamo, pagarCuota, eliminarPrestamo } from "../services/loanService";
import { iconAssets } from "../assets";

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * @param {object} props
 * @param {string} props.grupoId
 * @param {string} props.uidActual
 * @param {Array<{uid: string, nombre: string}>} props.miembros
 * @param {Array} props.prestamos - de useLoans
 */
export default function LoanManager({ grupoId, uidActual, miembros, prestamos }) {
  const [montoTotal, setMontoTotal] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prestamista, setPrestamista] = useState(uidActual);
  const [prestatario, setPrestatario] = useState("");
  const [cantidadCuotas, setCantidadCuotas] = useState(1);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const nombrePorUid = Object.fromEntries(miembros.map((m) => [m.uid, m.nombre]));

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await crearPrestamo(grupoId, {
        montoTotal: parseFloat(montoTotal.replace(",", ".")) || 0,
        prestamista,
        prestatario,
        descripcion,
        cantidadCuotas: Number(cantidadCuotas) || 1,
        creadoPor: uidActual,
      });
      setMontoTotal("");
      setDescripcion("");
      setPrestatario("");
      setCantidadCuotas(1);
      setMostrarFormulario(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta">
      <span className="etiqueta">Préstamos y compras directas</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Deudas individuales</h2>
        <button
          type="button"
          className="btn chico secundario"
          onClick={() => setMostrarFormulario((v) => !v)}
        >
          {mostrarFormulario ? "Cerrar" : "Nuevo"}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={manejarEnvio} style={{ marginTop: 10 }}>
          <label className="campo">Monto total (ARS)</label>
          <input
            type="text"
            inputMode="decimal"
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            required
          />

          <label className="campo">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Compra de electrodoméstico"
          />

          <label className="campo">Prestamista (quien pone la plata)</label>
          <select value={prestamista} onChange={(e) => setPrestamista(e.target.value)}>
            {miembros.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.nombre}
              </option>
            ))}
          </select>

          <label className="campo">Prestatario (quien debe la plata)</label>
          <select value={prestatario} onChange={(e) => setPrestatario(e.target.value)} required>
            <option value="" disabled>
              Seleccionar...
            </option>
            {miembros
              .filter((m) => m.uid !== prestamista)
              .map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nombre}
                </option>
              ))}
          </select>

          <label className="campo">Cantidad de cuotas</label>
          <input
            type="number"
            min={1}
            value={cantidadCuotas}
            onChange={(e) => setCantidadCuotas(e.target.value)}
          />

          {error && <p className="ayuda-error">{error}</p>}

          <button type="submit" className="btn bloque" style={{ marginTop: 12 }} disabled={enviando}>
            {enviando ? "Guardando..." : "Registrar préstamo"}
          </button>
        </form>
      )}

      <div style={{ marginTop: 14 }}>
        {prestamos.length === 0 && (
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
            No hay préstamos registrados todavía.
          </p>
        )}
        {prestamos.map((p) => (
          <div
            key={p.id}
            style={{
              border: "2px solid var(--ink)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 10,
              background: "var(--cream)",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span>
                {nombrePorUid[p.prestamista] ?? p.prestamista} le prestó{" "}
                {formatoARS.format(p.montoTotal)} a {nombrePorUid[p.prestatario] ?? p.prestatario}
              </span>
              <button
                type="button"
                className="btn-borrar"
                aria-label="Borrar préstamo"
                onClick={() => eliminarPrestamo(grupoId, p.id)}
              >
                <img src={iconAssets.trash} alt="" style={{ width: 14, height: 14 }} />
              </button>
            </p>
            <p style={{ margin: "2px 0 8px", fontSize: 12, color: "var(--burnt)", fontWeight: 600 }}>
              {p.descripcion || "Sin descripción"} · {p.estado} · saldo {formatoARS.format(p.saldoPendiente)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.cuotas.map((c) => (
                <button
                  key={c.numero}
                  type="button"
                  disabled={c.pagada}
                  onClick={() => pagarCuota(grupoId, p.id, c.numero)}
                  className="chip"
                  style={c.pagada ? { background: "var(--avocado)", color: "var(--paper)", cursor: "default" } : undefined}
                >
                  Cuota {c.numero}: {formatoARS.format(c.monto)}{c.pagada ? " ✓" : ""}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
