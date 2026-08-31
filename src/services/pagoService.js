// services/pagoService.js
// Pagos de la liquidación. Un pago pendiente nace de la liquidación actual
// (utils/calcularDeudas.js) cuando "deudor → acreedor" con un monto; en ese
// estado NO se guarda nada en la base. Lo que sí se persiste es el momento
// en que el acreedor confirma que lo recibió (marcarPagoRecibido): a partir
// de ahí el pago queda como "recibido" (con su fecha) y se descuenta de la
// deuda del par. Lo que no se confirmó se vuelve a derivar de los gastos y
// sigue figurando como "pendiente".
//
// Datos:
//   - /grupos/{grupoId}/pagos/{pagoId}     → un registro por par cobrado
//       { de, para, monto, confirmadoPor, confirmadoEn, creadoEn }
//   - /grupos/{grupoId}/liquidaciones/{id} → snapshot histórico de un cierre
//       { cerradoPor, cerradoEn, total, recibidos[] }
// Los permisos de escritura están cerrados en firebase/firestore.rules:
// solo el acreedor del par (para == auth.uid) puede crear el registro y
// solo quien lo confirmó puede desmarcarlo/borrarlo.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/** Escucha en vivo los pagos confirmados del grupo. */
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
 * Marca como recibido el pago pendiente de un par (deudor → acreedor).
 * @param {string} grupoId
 * @param {{de: string, para: string, monto: number}} pago
 */
export async function marcarPagoRecibido(grupoId, pago) {
  await addDoc(collection(db, "grupos", grupoId, "pagos"), {
    de: pago.de,
    para: pago.para,
    monto: pago.monto,
    confirmadoPor: pago.para,
    confirmadoEn: serverTimestamp(),
    creadoEn: serverTimestamp(),
  });
}

/** Deshace la marca: borra el registro y el pago vuelve a quedar pendiente. */
export async function desmarcarPagoRecibido(grupoId, pagoId) {
  await deleteDoc(doc(db, "grupos", grupoId, "pagos", pagoId));
}

/**
 * Cierra la liquidación: deja un snapshot histórico con los pagos recibidos
 * hasta ese momento (quién pagó, cuánto y cuándo se confirmó). Los que
 * siguen pendientes no cambian: se vuelven a calular de los gastos.
 * @param {string} grupoId
 * @param {string} uidActual
 * @param {{total: number, recibidos: Array}} datos
 */
export async function cerrarLiquidacion(grupoId, uidActual, { total, recibidos }) {
  await addDoc(collection(db, "grupos", grupoId, "liquidaciones"), {
    cerradoPor: uidActual,
    cerradoEn: serverTimestamp(),
    creadoEn: serverTimestamp(),
    total,
    recibidos,
  });
}