// components/LiquidationPanel.jsx
// Pestaña Liquidación — espacio personal, en tres niveles:
//   N1 · Situación: ¿cuánto debés? ¿cuánto te deben? ¿qué pagos esperan
//        confirmación? (tarjetas grandes, sin mezclar estados).
//   N2 · Consejo de liquidación: qué deuda conviene pagar primero, con
//        estrategias explícitas y modo "tengo X para pagar". Vive al pie de
//        la pestaña para que lo primero que se vea sea lo accionable.
//   N3 · Detalle: "Le debés a" (con alias para copiar y botón PAGAR),
//        "Te deben", "Pendientes de confirmación" e "Historial".
//
// Ciclo de vida de un pago (REGLA PRINCIPAL):
//   "Declaré que pagué" NO significa "la deuda está liquidada". Declarar un
//   pago solo crea el evento en estado "declarado"; la deuda descuenta
//   recién cuando el ACREEDOR lo confirma (o queda como rechazado si dice
//   que no lo recibió). Todo queda en el historial.
//
// Datos: todo se deriva de gastos + pagos (ver utils/liquidacion.js y
// services/pagoService.js). Solo los pagos confirmados bajan el saldo.

import { useMemo, useRef, useState } from "react";
import { formatoARS } from "../utils/format";
import {
  calcularPosicionLiquidacion,
  recomendarLiquidacion,
  planificarConMonto,
} from "../utils/liquidacion";
import {
  declararPagoEnviado,
  confirmarPagoRecibido,
  rechazarPago,
  cancelarPagoDeclarado,
} from "../services/pagoService";
import { InicialMiembro } from "./SettlementPanel";

// Traduce el error de Firestore a un mensaje accionable: el caso típico es
// que las reglas nuevas (ciclo de vida de /pagos) todavía no se publicaron.
function mensajeDeError(err) {
  const code = err?.code || "";
  if (code === "permission-denied" || code === "PERMISSION_DENIED") {
    return "Sin permisos para guardar: publicá las reglas nuevas de Firestore " +
      "(subcolección /pagos con ciclo de vida declarado/confirmado/rechazado) en " +
      "Firebase Console y volvé a intentar.";
  }
  return err?.message || "No se pudo actualizar el pago.";
}

function parsePeso(texto) {
  const limpio = String(texto ?? "").replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : NaN;
}

function antiguedadTexto(dias) {
  if (dias === null || dias === undefined) return "sin gasto con fecha";
  if (dias === 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

/** Tarjeta compacta del N1: una columna con el total por estado. */
function TarjetaEstado({ clase, etiqueta, monto }) {
  return (
    <div className="estado-liquidacion">
      <p className={`estado-liquidacion-etiqueta ${clase}`}>{etiqueta}</p>
      <p className="estado-liquidacion-monto">{formatoARS.format(monto)}</p>
    </div>
  );
}

export default function LiquidationPanel({ grupoId, uidActual, miembros, gastos, pagos = [] }) {
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [estrategia, setEstrategia] = useState("liberarme");
  const [dineroTexto, setDineroTexto] = useState("");
  const [analizador, setAnalizador] = useState(null);
  const [pagoModal, setPagoModal] = useState(null);
  const [rechazoPago, setRechazoPago] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [copiado, setCopiado] = useState({});
  const timers = useRef({});

  const pos = useMemo(
    () => calcularPosicionLiquidacion({ gastos, miembros, pagos, uidActual }),
    [gastos, miembros, pagos, uidActual]
  );

  const consejo = useMemo(
    () => recomendarLiquidacion(pos.deboA, estrategia),
    [pos.deboA, estrategia]
  );

  const nombreDe = useMemo(() => {
    const mapa = {};
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return (uid) => mapa[uid] ?? uid;
  }, [miembros]);

  function avisarMensaje(texto) {
    setMensaje(texto);
    if (timers.current.mensaje) clearTimeout(timers.current.mensaje);
    timers.current.mensaje = setTimeout(() => setMensaje(null), 5000);
  }

  function copiarTexto(texto, clave) {
    if (!texto) return;
    navigator.clipboard?.writeText?.(texto).then(
      () => {
        setCopiado((c) => ({ ...c, [clave]: true }));
        if (timers.current[clave]) clearTimeout(timers.current[clave]);
        timers.current[clave] = setTimeout(
          () => setCopiado((c) => ({ ...c, [clave]: false })),
          1600
        );
      },
      () => avisarMensaje("No se pudo copiar.")
    );
  }

  async function manejarDeclararPago({ para, monto }) {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando("declarar");
    try {
      await declararPagoEnviado(grupoId, { de: uidActual, para, monto });
      setPagoModal(null);
      avisarMensaje(`Pago de ${formatoARS.format(monto)} declarado. Esperando confirmación.`);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  async function manejarConfirmarPago(pago) {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando(`confirmar:${pago.id}`);
    try {
      await confirmarPagoRecibido(grupoId, pago.id, uidActual);
      setConfirmandoId(null);
      avisarMensaje(`Pago de ${formatoARS.format(pago.monto)} confirmado: recibido de ${pago.quien}.`);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  async function manejarRechazarPago(pago, motivo) {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando(`rechazar:${pago.id}`);
    try {
      await rechazarPago(grupoId, pago.id, uidActual, motivo);
      setRechazoPago(null);
      avisarMensaje(`Pago rechazado: la deuda de ${formatoARS.format(pago.monto)} sigue pendiente.`);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  async function manejarCancelarDeclaracion(pago) {
    if (procesando) return;
    setError(null);
    setMensaje(null);
    setProcesando(`cancelar:${pago.id}`);
    try {
      await cancelarPagoDeclarado(grupoId, pago.id);
      avisarMensaje("Declaración cancelada: el pago vuelve a estar solo pendiente.");
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  }

  function analizarDinero() {
    const n = parsePeso(dineroTexto);
    if (!Number.isFinite(n) || n <= 0) {
      avisarMensaje("Escribí cuánto tenés disponible para analizar.");
      setAnalizador(null);
      return;
    }
    setAnalizador(planificarConMonto(pos.deboA, n));
  }

  function abrirPagoDeuda(deuda) {
    setPagoModal({ ...deuda });
  }

  return (
    <>
      {error && <p className="ayuda-error" style={{ margin: "0 0 10px" }}>{error}</p>}
      {mensaje && <p className="aviso-flotante">{mensaje}</p>}

      {/* ---------- N1 · SITUACIÓN ---------- */}
      <div className="estado-liquidacion-grid">
        <TarjetaEstado clase="debo" etiqueta="Debés" monto={pos.totalDebo} />
        <TarjetaEstado clase="me-deben" etiqueta="Te deben" monto={pos.totalMeDeben} />
        <TarjetaEstado clase="pendiente" etiqueta="Pendiente de confirmación" monto={pos.totalPendienteConfirmacion} />
      </div>

      {/* ---------- N3 · LE DEBÉS A ---------- */}
      <div className="tarjeta-flotante">
        <h2>Le debés a</h2>
        {pos.deboA.length === 0 ? (
          <p className="estado-vacio">No tenés deudas pendientes con nadie.</p>
        ) : (
          <div className="lista-cuentas">
            {pos.deboA.map((d) => {
              const copiarClave = `alias:${d.para}`;
              return (
                <div className="cuenta-tarjeta debo" id={`deuda-${d.para}`} key={`de-bo-${d.para}`}>
                  <div className="cuenta-cabecera">
                    <InicialMiembro uid={d.para} nombre={d.nombre} tamano={34} />
                    <div className="cuenta-quien">
                      <p className="cuenta-nombre">{d.nombre}</p>
                      {d.alias ? (
                        <button
                          type="button"
                          className="alias-copiar"
                          onClick={() => copiarTexto(d.alias, copiarClave)}
                        >
                          {copiado[copiarClave] ? "Alias copiado ✓" : `Alias: ${d.alias}`}
                        </button>
                      ) : d.cbu ? (
                        <button
                          type="button"
                          className="alias-copiar"
                          onClick={() => copiarTexto(d.cbu, copiarClave)}
                        >
                          {copiado[copiarClave] ? "CBU copiado ✓" : "Ver CBU para pagarle"}
                        </button>
                      ) : (
                        <span className="sin-alias">Sin datos de cobro registrados</span>
                      )}
                    </div>
                  </div>
                  <div className="cuenta-detalles">
                    <span className="cuenta-monto">Le debés: <strong>{formatoARS.format(d.monto)}</strong></span>
                    <span className="cuenta-antiguedad">Antigüedad: {antiguedadTexto(d.antiguedadDias)}</span>
                  </div>
                  <div className="modal-acciones" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn chico accion"
                      onClick={() => abrirPagoDeuda(d)}
                      disabled={procesando !== null}
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- N3 · TE DEBEN ---------- */}
      <div className="tarjeta-flotante">
        <h2>Te deben</h2>
        {pos.meDeben.length === 0 ? (
          <p className="estado-vacio">No te deben nada por ahora.</p>
        ) : (
          <div className="lista-cuentas">
            {pos.meDeben.map((d) => (
              <div className="cuenta-tarjeta me-deben" key={`te-de-${d.de}`}>
                <div className="cuenta-cabecera">
                  <InicialMiembro uid={d.de} nombre={d.nombre} tamano={34} />
                  <div className="cuenta-quien">
                    <p className="cuenta-nombre">{d.nombre}</p>
                    <span className="cuenta-favor">te debe plata</span>
                  </div>
                </div>
                <div className="cuenta-detalles">
                  <span className="cuenta-monto favor">Te debe: <strong>{formatoARS.format(d.monto)}</strong></span>
                  <span className="cuenta-antiguedad">Antigüedad: {antiguedadTexto(d.antiguedadDias)}</span>
                </div>
                <p className="cuenta-nota">
                  Cuando te envíen el dinero y te lo declaren, aparece acá para
                  confirmar la recepción.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- N3 · PENDIENTES DE CONFIRMACIÓN ---------- */}
      <div className="tarjeta-flotante">
        <h2>Pendientes de confirmación</h2>
          {pos.pendientes.length === 0 ? (
            <p className="estado-vacio">Sin pagos esperando confirmación.</p>
          ) : (
            <div className="lista-pendientes">
              {pos.pendientes.map((p) =>
                p.sentido === "me-declararon" ? (
                  <div className="pendiente-fila cobrar" key={p.id}>
                    <div className="pendiente-info">
                      <p className="pendiente-titulo">
                        <strong>{p.quien}</strong> indica que te envió {formatoARS.format(p.monto)}
                      </p>
                      <p className="pendiente-meta">Estás cobrando este pago. ¿Lo recibiste?</p>
                    </div>
                    {confirmandoId === p.id ? (
                      <div className="pendiente-acciones confirmar-en-linea">
                        <span className="confirma-ayuda">¿Confirmás que recibiste {formatoARS.format(p.monto)}?</span>
                        <button
                          type="button"
                          className="btn chico accion"
                          disabled={procesando !== null}
                          onClick={() => manejarConfirmarPago(p)}
                        >
                          Sí, confirmar
                        </button>
                        <button type="button" className="btn chico secundario" disabled={procesando !== null} onClick={() => setConfirmandoId(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="pendiente-acciones">
                        <button
                          type="button"
                          className="btn chico accion"
                          disabled={procesando !== null}
                          onClick={() => setConfirmandoId(p.id)}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="btn chico secundario"
                          disabled={procesando !== null}
                          onClick={() => setRechazoPago(p)}
                        >
                          No recibí el pago
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pendiente-fila pagar" key={p.id}>
                    <div className="pendiente-info">
                      <p className="pendiente-titulo">
                        Declaraste haber pagado <strong>{formatoARS.format(p.monto)}</strong> a {p.quienPara}
                      </p>
                      <p className="pendiente-meta">Esperando confirmación del acreedor.</p>
                    </div>
                    <div className="pendiente-acciones">
                      <span className="pago-estado declarado">Esperando</span>
                      <button
                        type="button"
                        className="btn chico secundario"
                        disabled={procesando !== null}
                        onClick={() => manejarCancelarDeclaracion(p)}
                      >
                        Cancelar declaración
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>

      {/* ---------- N3 · HISTORIAL ---------- */}
      <div className="tarjeta-flotante">
        <details className="historial-details">
          <summary><h2 className="historial-titulo">Historial de pagos</h2></summary>
          {pagos.length === 0 ? (
            <p className="estado-vacio">Todavía no hay eventos de pago registrados.</p>
          ) : (
            <div className="historial-lista">
              {[...pagos]
                .sort((a, b) => (fechaMs(b) ?? 0) - (fechaMs(a) ?? 0))
                .map((p) => (
                  <div className="historial-fila" key={p.id}>
                    <span className={`pago-estado ${p.estado || "confirmado"}`}>
                      {etiquetaEstado(p)}
                    </span>
                    <div className="pendiente-info">
                      <p className="pendiente-titulo">
                        {nombreDe(p.de)} → {nombreDe(p.para)} · {formatoARS.format(p.monto)}
                      </p>
                      <p className="pendiente-meta">{fechaTexto(p)}{p.motivo ? ` — ${p.motivo}` : ""}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </details>
      </div>

      {/* ---------- N2 · CONSEJO DE LIQUIDACIÓN (pie de pestaña) ---------- */}
      <div className="tarjeta-flotante">
        <h2>Consejo de liquidación</h2>

        {consejo.recomendada ? (
          <div className="consejo-liquidacion">
            <div className="consejo-cuerpo">
              <InicialMiembro uid={consejo.recomendada.para} nombre={consejo.recomendada.nombre} tamano={34} />
              <div>
                <p className="consejo-titulo">
                  Te conviene pagar primero a <strong>{consejo.recomendada.nombre}</strong>
                </p>
                <p className="consejo-meta">
                  Deuda: <strong>{formatoARS.format(consejo.recomendada.monto)}</strong> ·
                  Antigüedad: {antiguedadTexto(consejo.recomendada.antiguedadDias)}
                </p>
                <p className="consejo-motivo">Motivo: {consejo.motivo}</p>
              </div>
            </div>
            <div className="modal-acciones" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn chico secundario"
                onClick={() => document.getElementById(`deuda-${consejo.recomendada.para}`)?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver detalle
              </button>
              <button
                type="button"
                className="btn chico accion"
                onClick={() => abrirPagoDeuda(consejo.recomendada)}
                disabled={procesando !== null}
              >
                Pagar {formatoARS.format(consejo.recomendada.monto)}
              </button>
            </div>
          </div>
        ) : (
          <p className="consejo-vacio">{consejo.motivo}</p>
        )}

        <p className="leyenda-matriz" style={{ marginTop: 12 }}>Cambiar estrategia:</p>
        <div className="estrategia-chips">
          {(["liberarme", "antiguedad", "monto"]).map((clave) => (
            <button
              type="button"
              key={clave}
              className={`estrategia-chip${estrategia === clave ? " sel" : ""}`}
              onClick={() => setEstrategia(clave)}
            >
              {clave === "liberarme" ? "Liberarme rápido" : clave === "antiguedad" ? "Más antiguas" : "Mayor monto"}
            </button>
          ))}
        </div>

        {/* Modo "tengo X para pagar" */}
        <div className="modo-dinero">
          <label className="campo">¿Cuánto dinero tenés disponible para liquidar ahora?</label>
          <div className="modo-dinero-fila">
            <input
              type="text"
              inputMode="decimal"
              value={dineroTexto}
              onChange={(e) => setDineroTexto(e.target.value)}
              placeholder="0"
            />
            <button type="button" className="btn chico accion" onClick={analizarDinero} disabled={procesando !== null}>
              Analizar
            </button>
          </div>
        </div>

        {analizador && analizador.length > 0 && (
          <div className="opciones-plan">
            {analizador.map((op) => (
              <div className="opcion-plan" key={op.clave}>
                <p className="opcion-titulo">{op.titulo}</p>
                {op.items.length > 0 ? (
                  <ul className="opcion-lista">
                    {op.items.map((it) => (
                      <li key={`${op.clave}-${it.para}`}>
                        <span>✓ {it.nombre} — {formatoARS.format(it.pagado)}</span>
                        {it.esParcial && <span className="opcion-parcial">(parcial)</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="opcion-lista-vacia">Ninguna deuda queda incluida.</p>
                )}
                <p className="opcion-porque">{op.porque}</p>
              </div>
            ))}
            <p className="leyenda-matriz">
              Las opciones son orientativas: vos decidís. La confirmación del
              acreedor siempre es obligatoria para saldar la deuda.
            </p>
          </div>
        )}
      </div>

      {/* Modal de pago (deudor) */}
      {pagoModal && (
        <SheetPagar
          deuda={pagoModal}
          pendientes={pos.pendientes}
          procesando={procesando}
          copiado={copiado}
          onCopiar={copiarTexto}
          onDeclarar={manejarDeclararPago}
          onCerrar={() => setPagoModal(null)}
        />
      )}

      {/* Modal de rechazo (acreedor) */}
      {rechazoPago && (
        <SheetRechazo
          pago={rechazoPago}
          procesando={procesando}
          onRechazar={manejarRechazarPago}
          onCerrar={() => setRechazoPago(null)}
        />
      )}
    </>
  );
}

function fechaMs(p) {
  const t = p.confirmadoEn ?? p.rechazadoEn ?? p.declaradoEn ?? p.creadoEn;
  return t?.toMillis ? t.toMillis() : null;
}

function fechaTexto(p) {
  const t = fechaMs(p);
  if (!t) return "Sin fecha";
  return new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function etiquetaEstado(p) {
  switch (p.estado) {
    case "declarado": return "Declarado";
    case "rechazado": return "No confirmado";
    case "cancelado": return "Cancelado";
    default: return "Confirmado";
  }
}

/** Sheet (modal) del deudor: ver alias/CBU, copiar y declarar el pago. */
function SheetPagar({ deuda, pendientes, procesando, copiado, onCopiar, onDeclarar, onCerrar }) {
  const [montoTexto, setMontoTexto] = useState(deuda.monto ? String(deuda.monto) : "");
  const [errorLocal, setErrorLocal] = useState(null);

  const monto = parsePeso(montoTexto);
  const montoInvalido = !Number.isFinite(monto) || monto <= 0 || monto > deuda.monto + 0.005;

  const yaDeclarado = pendientes.some(
    (p) => p.sentido === "declare-yo" && p.para === deuda.para && Number.isFinite(monto) && Math.abs(p.monto - monto) < 0.005
  );

  function confirmar() {
    if (montoInvalido) {
      setErrorLocal(`El monto debe ser mayor a 0 y no superar ${formatoARS.format(deuda.monto)}.`);
      return;
    }
    if (yaDeclarado) {
      setErrorLocal("Ya declaraste un pago de ese mismo monto a esta persona. Esperá la confirmación.");
      return;
    }
    setErrorLocal(null);
    onDeclarar({ para: deuda.para, monto });
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Pagar a" onClick={(e) => e.stopPropagation()}>
        <h3>Pagar a {deuda.nombre}</h3>
        <p className="pendiente-meta" style={{ margin: "0 0 8px" }}>
          Le debés {formatoARS.format(deuda.monto)} · Antigüedad: {antiguedadTexto(deuda.antiguedadDias)}
        </p>

        {deuda.alias ? (
          <div className="sheet-forma-pago">
            <span className="sheet-campo">Alias</span>
            <strong className="sheet-valor">{deuda.alias}</strong>
            <button type="button" className="btn chico secundario" onClick={() => onCopiar(deuda.alias, `alias:${deuda.para}`)} disabled={procesando !== null}>
              {copiado[`alias:${deuda.para}`] ? "Copiado ✓" : "Copiar alias"}
            </button>
          </div>
        ) : deuda.cbu ? (
          <div className="sheet-forma-pago">
            <span className="sheet-campo">CBU</span>
            <strong className="sheet-valor">{deuda.cbu}</strong>
            <button type="button" className="btn chico secundario" onClick={() => onCopiar(deuda.cbu, `alias:${deuda.para}`)} disabled={procesando !== null}>
              {copiado[`alias:${deuda.para}`] ? "Copiado ✓" : "Copiar CBU"}
            </button>
          </div>
        ) : (
          <p className="ayuda-error" style={{ margin: "0 0 8px" }}>
            {deuda.nombre} todavía no registró alias ni CBU. Pedíselos antes de pagar.
          </p>
        )}

        <label className="campo">Monto a enviar</label>
        <input
          type="text"
          inputMode="decimal"
          value={montoTexto}
          onChange={(e) => setMontoTexto(e.target.value)}
          placeholder={deuda.monto ? String(deuda.monto) : "0"}
        />
        {montoInvalido && <p className="ayuda-error">El monto debe ser mayor a 0 y no superar {formatoARS.format(deuda.monto)}.</p>}
        {yaDeclarado && <p className="ayuda-error">Ya declaraste un pago de ese mismo monto a esta persona. Esperá la confirmación.</p>}
        {errorLocal && <p className="ayuda-error">{errorLocal}</p>}

        <p className="leyenda-matriz" style={{ marginTop: 8 }}>
          1) Copiá el alias y transferí. 2) Declará el pago: quedará esperando
          confirmación de {deuda.nombre}. La deuda se descuenta recién cuando confirma.
        </p>

        <div className="modal-acciones">
          <button type="button" className="btn chico secundario" onClick={onCerrar} disabled={procesando !== null}>
            Cancelar
          </button>
          <button type="button" className="btn chico accion" onClick={confirmar} disabled={procesando !== null}>
            {procesando === "declarar" ? "Registrando..." : "Ya realicé el pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Sheet del acreedor: motivo del rechazo (opcional) y confirmar el rechazo. */
function SheetRechazo({ pago, procesando, onRechazar, onCerrar }) {
  const [motivo, setMotivo] = useState("No recibí el dinero");
  const opciones = ["No recibí el dinero", "El monto recibido es diferente", "Otro problema"];

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Rechazar pago" onClick={(e) => e.stopPropagation()}>
        <h3>No recibiste el pago</h3>
        <p className="pendiente-meta" style={{ margin: "0 0 8px" }}>
          {pago.quien} declaró haberte enviado {formatoARS.format(pago.monto)}. Si no lo recibiste, lo rechazás: la deuda sigue pendiente y el evento queda en el historial.
        </p>
        <div className="estrategia-chips" style={{ flexDirection: "column", alignItems: "stretch" }}>
          {opciones.map((op) => (
            <label key={op} className={`radio-motivo${motivo === op ? " sel" : ""}`}>
              <input type="radio" name="motivo" value={op} checked={motivo === op} onChange={() => setMotivo(op)} />
              {op}
            </label>
          ))}
        </div>
        <div className="modal-acciones">
          <button type="button" className="btn chico secundario" onClick={onCerrar} disabled={procesando !== null}>
            Volver
          </button>
          <button type="button" className="btn chico peligro" disabled={procesando !== null} onClick={() => onRechazar(pago, motivo)}>
            {procesando ? "Rechazando..." : "Rechazar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}