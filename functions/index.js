// functions/index.js
// Cloud Function de INTEGRIDAD de DouPiggy (una sola, on-demand).
//
// IMPORTANTE (no comprometer funcionalidad ni estructura):
//   - No se invoca desde el front (la app no cambia).
//   - No altera el esquema: solo sana la división de un gasto a centavos.
//     Las reglas de Firestore NO se tocan: las Cloud Functions usan
//     firebase-admin (credenciales de servicio) y eluden las reglas de
//     seguridad a propósito — por eso recae una tarea que el cliente no
//     debería hacer.
//   - Es IDEMPOTENTE: correrla N veces no cambia el resultado.
//
// NOTA DE COSTO: se eliminaron las dos funciones "scheduled" (limpiarPagos
// Huerfanos y limpiarInvitacionesVencidas) porque, al ser cron (pubsub),
// exigen un plan con facturación activada y su costo recurrente supera el
// beneficio que aportan. Esta función on-demand se mantiene porque solo se
// ejecuta ante una escritura real de un gasto y vive dentro del free tier.

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Región por defecto: la misma que usa el proyecto (us-central1 por defecto).
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

// RECONCILIAR DIVISIÓN DE GASTOS  (trigger onDocumentWritten, idempotente)
// Verifica que gasto.division sume exactamente el monto del gasto y, si se
// desvía por centavos (redondeo), reajusta el primer participante para que
// sume el total. NUNCA toca monto/participantes/pagadoPor/tipoDivision.
//
// Anti-loop: si la division ya es correcta (o el desvío es > 1 centavo,
// señal de división personalizada), NO escribe nada. Al no escribir, no se
// vuelve a disparar el trigger.
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
