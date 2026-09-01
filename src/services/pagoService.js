// services/pagoService.js
// Pagos de la liquidación con ciclo de vida completo y trazable:
//
//   La deuda pendiente por par SIEMPRE se deriva de los gastos
//   (utils/calcularDeudas.js): lo que el acreedor ya cobró (pagos en estado
//   "confirmado", o legacy sin estado) se descuenta y el resto sigue
//   figurando como saldo. Una declaración del deudor ("ya pagué") NO liquida
//   nada: queda en estado "declarado" esperando la confirmación del
//   acreedor, que es el único que puede pasarla a "confirmado" o
//   "rechazado". Así una deuda nunca desaparece sin registro.
//
//   Estados:
//     declarado  → el deudor declaró que envió el dinero (de == auth.uid).
//     confirmado → el acreedor confirma que lo recibió (para == auth.uid);
//                  recién acá descuenta del saldo del par.
//     rechazado  → el acreedor dice que no lo recibió (con motivo opcional);
//                  la deuda sigue pendiente y el evento queda en historial.
//     cancelado  → el deudor cancela su propia declaración antes de que la
//                  confirmen.
//
//   Datos:
//     /grupos/{grupoId}/pagos/{pagoId}
//       { de, para, monto, estado,
//         declaradoPor, declaradoEn,       // al declarar
//         confirmadoPor, confirmadoEn,     // al confirmar
//         rechazadoPor, rechazadoEn, motivo, // al rechazar
//         creadoEn }
//   Los permisos están cerrados en firebase/firestore.rules con la máquina
//   de estados: solo el deudor crea "declarado"; solo el acreedor puede
//   confirmar/rechazar; solo el deudor cancela mientras siga "declarado".
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

/** true si el pago ya está confirmado como recibido (descuenta saldo). */
export function esPagoConfirmado(pago) {
  return !pago?.estado || pago.estado === "confirmado";
}

/** Escucha en vivo todos los pagos (cualquier estado) del grupo. */
export function suscribirseAPagos(grupoId, callback, onError) {
  const q = query(collection(db, "grupos", grupoId, "pagos"), orderBy("creadoEn", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => onError?.(error)
  );
}

/**
 * El DEUDOR declara que envió un pago a su acreedor. NO liquida nada: queda
 * en estado "declarado" esperando que el acreedor confirme la recepción.
 * @param {string} grupoId
 * @param {{de: string, para: string, monto: number}} pago
 * @returns {Promise<string>} id del pago creado
 */
export async function declararPagoEnviado(grupoId, pago) {
  const ref = await addDoc(collection(db, "grupos", grupoId, "pagos"), {
    de: pago.de,
    para: pago.para,
    monto: pago.monto,
    estado: "declarado",
    declaradoPor: pago.de,
    declaradoEn: serverTimestamp(),
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
  await updateDoc(doc(db, "grupos", grupoId, "pagos", pagoId), {
    estado: "confirmado",
    confirmadoPor: confirmadorUid,
    confirmadoEn: serverTimestamp(),
  });
}

/**
 * El ACREEDOR rechaza un pago declarado (no lo recibió / monto distinto).
 * La deuda sigue pendiente y el evento queda en el historial con su estado.
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