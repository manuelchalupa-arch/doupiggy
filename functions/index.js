// functions/index.js
// Cloud Functions de INTEGRIDAD y LIMPIEZA de DouPiggy.
//
// IMPORTANTE (no comprometer funcionalidad ni estructura):
//   - Ninguna de estas funciones se invoca desde el front (la app no cambia).
//   - Ninguna altera el esquema: solo sanean datos que la app ya maneja bien
//     o limpian basura acumulada. Las reglas de Firestore NO se tocan: las
//     Cloud Functions usan firebase-admin (credenciales de servicio) y
//     eluden las reglas de seguridad a propósito — por eso recaen tareas de
//     mantenimiento que el cliente no debería poder hacer.
//   - Todas son IDEMPOTENTES: correrlas N veces no cambia el resultado.

const functions = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Región por defecto: la misma que usa el proyecto (us-central1 por defecto).
// Cambiar acá si el proyecto vive en otra región.
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// 1) LIMPIAR PAGOS HUÉRFANOS  (scheduled, diario)
//    Borra pagos CONFIRMADOS cuyo par ya no tiene deuda bruta (el gasto que
//    los originaba desapareció). La app ya los ignora en todos los cálculos,
//    así que borrarlos no cambia ningún número visible; solo evita que la
//    subcolección pagos acumule registros muertos para siempre.
// ---------------------------------------------------------------------------
/**
 * ¿El par (de → para) todavía tiene deuda BRUTA?
 * Mismo criterio que utils/nivelSaldo.js en el front (parTieneDeudaBruta):
 * existe al menos un gasto donde "para" pagó y "de" es participante.
 * Mantenerlo idéntico es lo que garantiza que acá se borre un pago EXACTAMENTE
 * cuando la app ya lo ignora en los cálculos (fix B3), y nunca antes.
 */
function parTieneDeudaBruta(gastos, de, para) {
  return gastos.some(
    (g) => g.pagadoPor === para && Array.isArray(g.participantes) && g.participantes.includes(de)
  );
}

exports.limpiarPagosHuerfanos = functions.onSchedule("0 7 * * *", async (event) => {
  let borrados = 0;
  let gruposRecorridos = 0;

  const gruposSnap = await db.collection("grupos").get();
  for (const grupoDoc of gruposSnap.docs) {
    gruposRecorridos++;

    const gastosSnap = await db.collection(`grupos/${grupoDoc.id}/gastos`).get();
    const gastos = gastosSnap.docs.map((g) => g.data());

    const pagosSnap = await db.collection(`grupos/${grupoDoc.id}/pagos`).get();
    // Confirmados: estado == "confirmado" O legacy sin estado (esPagoConfirmado).
    const huerfanos = pagosSnap.docs
      .filter((p) => {
        const data = p.data();
        if (!(data.estado == null || data.estado === "confirmado")) return false;
        return !parTieneDeudaBruta(gastos, data.de, data.para);
      })
      .map((p) => p.ref);

    if (huerfanos.length === 0) continue;

    // Borrado DEFINITIVO (decisión del usuario): en batches de 450 para
    // respetar el máximo de 500 operaciones por transacción atómica.
    for (let i = 0; i < huerfanos.length; i += 450) {
      const lote = huerfanos.slice(i, i + 450);
      const batch = db.batch();
      lote.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    borrados += huerfanos.length;
  }

  logger.log(`limpiarPagosHuerfanos: ${borrados} pagos huérfanos borrados en ${gruposRecorridos} grupos.`);
});

// ---------------------------------------------------------------------------
// 2) LIMPIAR INVITACIONES VENCIDAS  (scheduled, diario)
//    Borra invitaciones ya vencidas o sin cupo restante. La app nunca las
//    muestra después de aceptar/vencer, así que son basura acumulada.
// ---------------------------------------------------------------------------
function toMillis(ts) {
  if (ts == null) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds != null) return ts.seconds * 1000;
  return typeof ts === "number" ? ts : null;
}

exports.limpiarInvitacionesVencidas = functions.onSchedule("0 7 * * *", async (event) => {
  const ahora = Date.now();
  const expiradas = await db.collection("invitaciones").get();

  // Nunca borrar una invitación manipulada (sin fecha): quedarse.
  const aBorrar = expiradas.docs.filter((d) => {
    const data = d.data();
    const expiraEn = toMillis(data.expiraEn);
    const vencida = expiraEn != null && expiraEn < ahora;
    const sinCupo =
      data.usosMaximos != null && data.usosActuales != null && data.usosActuales >= data.usosMaximos;
    return expiraEn != null && (vencida || sinCupo);
  });

  for (let i = 0; i < aBorrar.length; i += 450) {
    const lote = aBorrar.slice(i, i + 450);
    const batch = db.batch();
    lote.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  logger.log(`limpiarInvitacionesVencidas: ${aBorrar.length} invitaciones borradas.`);
});

// ---------------------------------------------------------------------------
// 3) RECONCILIAR DIVISIÓN DE GASTOS  (trigger onDocumentWritten, idempotente)
//    Verifica que gasto.division sume exactamente el monto del gasto y, si se
//    desvía por centavos (redondeo), reajusta el primer participante para que
//    sume el total. NUNCA toca monto/participantes/pagadoPor/tipoDivision.
//
//    Anti-loop: si la division ya es correcta (o el desvío es > 1 centavo,
//    señal de división personalizada), NO escribe nada. Al no escribir, no se
//    vuelve a disparar el trigger.
// ---------------------------------------------------------------------------
exports.reconciliarDivision = onDocumentWritten("grupos/{grupoId}/gastos/{gastoId}", async (event) => {
  const despues = event.data?.after?.data?.();
  if (!despues) return; // borrado: nada que reconciliar

  const { monto, participantes, division, tipoDivision } = despues;
  if (typeof monto !== "number" || !Array.isArray(participantes) || participantes.length === 0) {
    return; // esquema no aplicable, no tocar
  }
  if (!division || typeof division !== "object") return; // legacy sin division: lo resuelve el front

  const suma = Object.keys(division).reduce((acc, uid) => acc + (Number(division[uid]) || 0), 0);
  const desvio = Math.round((suma - monto) * 100) / 100;

  // Sin desvío: ya está correcto, no escribir (evita el loop).
  if (Math.abs(desvio) < 0.005) return;

  // Desvío de > 1 centavo podría ser división personalizada intencional.
  if (Math.abs(desvio) > 1.01) return;
  if (tipoDivision === "personalizada") return;

  // Corrección mínima: absorber el desvío en el PRIMER participante que existe
  // en la división, dejando la suma exacta = monto.
  const nuevaDivision = { ...division };
  const primerUid = participantes.find((uid) => nuevaDivision[uid] != null);
  if (primerUid == null) return;
  nuevaDivision[primerUid] =
    Math.round((Number(nuevaDivision[primerUid] || 0) - desvio) * 100) / 100;
  if (nuevaDivision[primerUid] < 0) return; // no llevar a negativo: dejar como está

  await event.data.after.ref.set({ division: nuevaDivision }, { merge: true });
  logger.log(`reconciliarDivision: ajustado gasto ${event.params.gastoId} (desvío ${desvio}).`);
});
