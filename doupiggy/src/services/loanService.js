// services/loanService.js
// Deudas individuales que NO se dividen entre el grupo (préstamos directos
// entre dos personas), con soporte opcional de pago en cuotas (Bloque 5).

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Genera el array de cuotas a partir del monto total y la cantidad de cuotas.
 * Igual que en la división de gastos, el redondeo se ajusta para que la suma
 * de las cuotas sea exactamente el monto total.
 */
export function generarCuotas(montoTotal, cantidadCuotas) {
  if (cantidadCuotas <= 0) {
    throw new Error("La cantidad de cuotas debe ser mayor a cero.");
  }

  const centavosTotales = Math.round(montoTotal * 100);
  const centavosBase = Math.floor(centavosTotales / cantidadCuotas);
  let resto = centavosTotales - centavosBase * cantidadCuotas;

  const cuotas = [];
  for (let numero = 1; numero <= cantidadCuotas; numero += 1) {
    let centavos = centavosBase;
    if (resto > 0) {
      centavos += 1;
      resto -= 1;
    }
    cuotas.push({
      numero,
      monto: centavos / 100,
      pagada: false,
      pagadaEn: null,
    });
  }
  return cuotas;
}

/**
 * Crea un préstamo o compra directa. Si `cantidadCuotas` es 1 (o se omite),
 * se trata como pago único.
 */
export async function crearPrestamo(grupoId, {
  montoTotal,
  prestamista,
  prestatario,
  descripcion,
  cantidadCuotas = 1,
  creadoPor,
}) {
  if (!(montoTotal > 0)) {
    throw new Error("El monto debe ser mayor a cero.");
  }
  if (prestamista === prestatario) {
    throw new Error("El prestamista y el prestatario deben ser personas distintas.");
  }

  const cuotas = generarCuotas(montoTotal, cantidadCuotas);

  const ref = await addDoc(collection(db, "grupos", grupoId, "prestamos"), {
    montoTotal,
    prestamista,
    prestatario,
    descripcion: descripcion?.trim() ?? "",
    cuotas,
    saldoPendiente: montoTotal,
    estado: "activo",
    creadoPor,
    creadoEn: serverTimestamp(),
  });

  return ref.id;
}

/**
 * Marca una cuota como pagada de forma atómica y actualiza el saldo
 * pendiente y el estado general del préstamo.
 */
export async function pagarCuota(grupoId, prestamoId, numeroCuota) {
  const ref = doc(db, "grupos", grupoId, "prestamos", prestamoId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El préstamo no existe.");

    const datos = snap.data();
    const cuotas = datos.cuotas.map((c) =>
      c.numero === numeroCuota && !c.pagada
        ? { ...c, pagada: true, pagadaEn: new Date().toISOString() }
        : c
    );

    const saldoPendiente =
      Math.round(
        cuotas.filter((c) => !c.pagada).reduce((acc, c) => acc + c.monto, 0) * 100
      ) / 100;

    const estado = saldoPendiente <= 0.005 ? "saldado" : "activo";

    tx.update(ref, { cuotas, saldoPendiente, estado });
  });
}

export async function eliminarPrestamo(grupoId, prestamoId) {
  await deleteDoc(doc(db, "grupos", grupoId, "prestamos", prestamoId));
}

export async function actualizarPrestamo(grupoId, prestamoId, cambios) {
  await updateDoc(doc(db, "grupos", grupoId, "prestamos", prestamoId), cambios);
}

/** Suscripción en tiempo real a los préstamos de un grupo. */
export function suscribirseAPrestamos(grupoId, callback) {
  const q = query(
    collection(db, "grupos", grupoId, "prestamos"),
    orderBy("creadoEn", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const prestamos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(prestamos);
  });
}

/**
 * Deriva, para un uid dado, la lista de préstamos donde participa como
 * prestamista o prestatario, junto con su rol y saldo pendiente relativo.
 * Útil para mostrar "lo que me deben" / "lo que debo" fuera del contexto
 * del reparto general de gastos.
 */
export function resumenPrestamosPorUsuario(prestamos, uid) {
  return prestamos
    .filter((p) => p.prestamista === uid || p.prestatario === uid)
    .map((p) => ({
      ...p,
      rol: p.prestamista === uid ? "prestamista" : "prestatario",
      signoSaldo: p.prestamista === uid ? 1 : -1,
    }));
}
