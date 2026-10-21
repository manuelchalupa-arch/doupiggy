// services/pagoService.js
// Obligaciones y pagos de la liquidación con ciclo de vida completo y
// sincronizado entre ambas partes (deudor y acreedor).
//
//   Hay UNA única entidad por obligación entre un par (deudor → acreedor).
//   Esa misma entidad avanza por su ciclo de vida y se persiste en
//   Firestore, de modo que ambos lados la ven actualizada en vivo (onSnapshot).
//
//   Estados (definición de negocio):
//     PENDING           → existe una deuda derivada de los gastos, todavía no
//                         informada. Solo existe en la vista (se calcula de
//                         los gastos); no se persiste hasta que se informa.
//     PAYMENT_REPORTED  → el DEUDOR marcó la casilla "realicé el pago". Se
//                         persiste el registro. La deuda NO se considera
//                         saldada todavía. La contraparte (acreedor) lo ve en
//                         "Pendientes de confirmación".
//     RECEIPT_CONFIRMED → el ACREEDOR marcó "confirmo que recibí el pago".
//                         Recién acá se descuenta de la deuda (se salda).
//     ARCHIVED          → la liquidación del grupo se cerró y este movimiento
//                         pasó al historial (solo para auditoría/informes).
//
//   Datos persistidos (una entidad única por obligación):
//     /grupos/{grupoId}/pagos/{pagoId}
//       {
//         id, grupoId, de, para, monto,
//         concepto: string,            // descripción/liq. relacionada
//         estado: "PAYMENT_REPORTED" | "RECEIPT_CONFIRMED" | "ARCHIVED",
//         creadoEn,                    // nace al informar el pago
//         informadoEn,                 // fecha en que el deudor informó
//         confirmadoEn,                // fecha en que el acreedor confirmó
//         informadoPor, confirmadoPor  // uids (auditoría)
//       }
//
//   Compatibilidad: el esquema viejo usaba "declarado" / "confirmado" (y
//   legacy sin estado). Se siguen interpretando para no perder los registros
//   existentes: "declarado" → PAYMENT_REPORTED, confirmado/legacy →
//   RECEIPT_CONFIRMED. A partir de ahora se escriben los estados nuevos.

import {
  addDoc,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Estados canónicos del ciclo de vida.
export const ESTADO = {
  PENDING: "PENDING",
  PAYMENT_REPORTED: "PAYMENT_REPORTED",
  RECEIPT_CONFIRMED: "RECEIPT_CONFIRMED",
  ARCHIVED: "ARCHIVED",
};

/** Normaliza un estado (viejo o nuevo) al estado canónico, o null si no aplica. */
export function estadoCanonico(estado) {
  const e = estado?.toUpperCase?.() ?? estado;
  if (e === "DECLARADO" || e === "PAYMENT_REPORTED") return ESTADO.PAYMENT_REPORTED;
  if (e === "CONFIRMADO" || e === "RECEIPT_CONFIRMED") return ESTADO.RECEIPT_CONFIRMED;
  if (e === "CANCELADO" || e === "RECHAZADO") return null; // flujos terminales del viejo esquema: no cuentan
  if (e === "ARCHIVED") return ESTADO.ARCHIVED;
  // Sin estado = legacy confirmado (el acreedor lo creó como recibido).
  if (!estado) return ESTADO.RECEIPT_CONFIRMED;
  return null;
}

/** true si el pago ya está confirmado como recibido (descuenta saldo). */
export function esPagoConfirmado(pago) {
  if (!pago?.estado || pago.estado === "confirmado") return true;
  return estadoCanonico(pago.estado) === ESTADO.RECEIPT_CONFIRMED;
}

/** true si el pago está informado por el deudor y esperando confirmación. */
export function esPagoInformado(pago) {
  return estadoCanonico(pago.estado) === ESTADO.PAYMENT_REPORTED;
}

/** Escucha en vivo todos los pagos (cualquier estado) del grupo. */
export function suscribirseAPagos(grupoId, callback, onError) {
  const q = query(collection(db, "grupos", grupoId, "pagos"), orderBy("creadoEn", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const pagos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Las lecturas viejas del front esperan estados "declarado"/"confirmado":
      // entregamos una vista normalizada para no romper los cálculos existentes.
      callback(pagos.map((p) => mapearEstadoLegacy(p)));
    },
    (error) => onError?.(error)
  );
}

// El front (calcularDeudas, liquidacion, nivelSaldo) sigue usando los estados
// "declarado"/"confirmado" internamente. Esta vista traduce los nuevos a los
// viejos para mantener un único punto de cambio (este servicio).
export function mapearEstadoLegacy(p) {
  const canon = estadoCanonico(p.estado);
  if (canon === ESTADO.PAYMENT_REPORTED && p.estado !== "declarado") return { ...p, estado: "declarado" };
  if (canon === ESTADO.RECEIPT_CONFIRMED && p.estado !== "confirmado") return { ...p, estado: "confirmado" };
  if (canon === ESTADO.ARCHIVED) return { ...p, estado: "archivado" };
  return p;
}

/**
 * El DEUDOR informa que envió un pago a su acreedor (persiste la obligación).
 * NO liquida nada: pasa la entidad a PAYMENT_REPORTED y la contraparte la ve
 * en "Pendientes de confirmación". La deuda se salda recién al confirmarse.
 *
 * NOTA IMPORTANTE DE CONSISTENCIA (regla técnica "una única entidad"):
 * por diseño, esta función se llama SOLO cuando todavía no existe una
 * obligación persistida para el par. Si ya existe una PAYMENT_REPORTED
 * pendiente, la UI no vuelve a crear otra (evita duplicar la misma deuda).
 *
 * @param {string} grupoId
 * @param {{de: string, para: string, monto: number, concepto?: string}} pago
 * @returns {Promise<string>} id de la obligación/pago creada
 */
export async function declararPagoEnviado(grupoId, pago) {
  if (!(pago.monto > 0)) {
    throw new Error("El monto de la declaración debe ser mayor a cero.");
  }
  if (!pago.de || !pago.para || pago.de === pago.para) {
    throw new Error("La declaración necesita un deudor y un acreedor distintos.");
  }
  const ref = await addDoc(collection(db, "grupos", grupoId, "pagos"), {
    grupoId,
    de: pago.de,
    para: pago.para,
    monto: pago.monto,
    concepto: pago.concepto ?? null,
    estado: ESTADO.PAYMENT_REPORTED,
    informadoPor: pago.de,
    informadoEn: serverTimestamp(),
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

/**
 * El ACREEDOR confirma que recibió un pago declarado. Recién acá la deuda
 * del par se descuenta (calcularDeudas solo descuenta confirmados).
 * @param {string} grupoId
 * @param {string} pagoId
 * @param {string} confirmadorUid - debe ser el acreedor (para) del pago
 */
export async function confirmarPagoRecibido(grupoId, pagoId, confirmadorUid) {
  // El ACREEDOR confirma la recepción: RECEIPT_CONFIRMED. Recién acá la deuda
  // del par se descuenta (calcularDeudas/calcularBalanceGrupo solo descuentan
  // confirmados). La contraparte (deudor) ve el cambio en vivo vía onSnapshot.
  await updateDoc(doc(db, "grupos", grupoId, "pagos", pagoId), {
    estado: ESTADO.RECEIPT_CONFIRMED,
    confirmadoPor: confirmadorUid,
    confirmadoEn: serverTimestamp(),
  });
}

/**
 * El ACREEDOR rechaza un pago informado (no lo recibió / monto distinto).
 * La deuda sigue pendiente y el evento queda en el historial con su estado.
 * En el nuevo esquema el rechazo devuelve la obligación a PENDING (sigue
 * derivada de los gastos): la entidad pasa a un estado terminal "RECHAZADO"
 * que no descuenta. Si la UI vuelve a informar, crea una entidad nueva.
 * @param {string} grupoId
 * @param {string} pagoId
 * @param {string} rechazadorUid - debe ser el acreedor (para) del pago
 * @param {string} [motivo] - opcional: explicación del rechazo
 */
export async function rechazarPago(grupoId, pagoId, rechazadorUid, motivo = "") {
  await updateDoc(doc(db, "grupos", grupoId, "pagos", pagoId), {
    estado: "rechazado",
    rechazadoPor: rechazadorUid,
    rechazadoEn: serverTimestamp(),
    motivo,
  });
}

/**
 * El DEUDOR cancela su propia declaración mientras todavía no fue
 * confirmada ni rechazada. La deuda vuelve a estar íntegra.
 * @param {string} grupoId
 * @param {string} pagoId
 */
export async function cancelarPagoDeclarado(grupoId, pagoId) {
  await updateDoc(doc(db, "grupos", grupoId, "pagos", pagoId), {
    estado: "cancelado",
  });
}

/**
 * Marca un pago/obligación como ARCHIVED (cierre de liquidación). Solo para
 * mantenimiento/servicio interno; normalmente el archivado lo decide la capa
 * de cierre de ciclo en este módulo.
 * @param {string} grupoId
 * @param {string} pagoId
 */
export async function archivarPago(grupoId, pagoId) {
  await updateDoc(doc(db, "grupos", grupoId, "pagos", pagoId), {
    estado: ESTADO.ARCHIVED,
    archivadoEn: serverTimestamp(),
  });
}

/**
 * Idempotente y pensado para el default: devuelve si YA existe una
 * obligación informada (PAYMENT_REPORTED) pendiente para el par.
 * Se usa para que el deudor no duplique la misma declaración.
 */
export function yaHayPagoInformado(pagos, de, para) {
  return (pagos || []).some((p) => {
    const c = estadoCanonico(p.estado);
    const deCoincide = (p.de ?? p.de?.id) === de;
    const paraCoincide = (p.para ?? p.para?.id) === para;
    return deCoincide && paraCoincide && c === ESTADO.PAYMENT_REPORTED;
  });
}