// services/expenseService.js
// Lógica de negocio de DouPiggy: alta, edición, baja y el
// cálculo de la división en partes iguales (Bloque 3).

import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Calcula la división en partes iguales de un monto entre una lista de uids.
 * Los centavos sobrantes (por redondeo) se asignan de a uno a los primeros
 * participantes en la lista, para que la suma de la división sea exactamente
 * igual al monto total (evita descuadres por redondeo de coma flotante).
 *
 * @param {number} monto - en pesos argentinos, admite centavos.
 * @param {string[]} participantes - uids entre los que se divide.
 * @returns {Record<string, number>} mapa uid -> monto asignado
 */
export function calcularDivisionIgualitaria(monto, participantes) {
  if (!participantes.length) return {};

  const centavosTotales = Math.round(monto * 100);
  const cantidadParticipantes = participantes.length;
  const centavosBase = Math.floor(centavosTotales / cantidadParticipantes);
  let resto = centavosTotales - centavosBase * cantidadParticipantes;

  const division = {};
  for (const uid of participantes) {
    let centavosAsignados = centavosBase;
    if (resto > 0) {
      centavosAsignados += 1;
      resto -= 1;
    }
    division[uid] = centavosAsignados / 100;
  }
  return division;
}

/**
 * Valida y arma el payload de un gasto nuevo. Separado de `crearGasto` para
 * poder testear la lógica sin tocar Firestore.
 */
export function construirPayloadGasto({
  monto,
  descripcion,
  pagadoPor,
  participantes,
  creadoPor,
  divisionPersonalizada = null,
}) {
  if (!(monto > 0)) {
    throw new Error("El monto debe ser mayor a cero.");
  }
  if (!descripcion?.trim()) {
    throw new Error("La descripción es obligatoria.");
  }
  if (!participantes?.length) {
    throw new Error("Debe seleccionar al menos un participante.");
  }
  if (!participantes.includes(pagadoPor)) {
    throw new Error("Quien paga debe estar incluido entre los participantes.");
  }

  const esPersonalizada = divisionPersonalizada !== null;
  const division = esPersonalizada
    ? divisionPersonalizada
    : calcularDivisionIgualitaria(monto, participantes);

  if (esPersonalizada) {
    const sumaDivision = Object.values(division).reduce((a, b) => a + b, 0);
    if (Math.abs(sumaDivision - monto) > 0.01) {
      throw new Error("La división personalizada no suma el monto total.");
    }
  }

  return {
    monto,
    descripcion: descripcion.trim(),
    pagadoPor,
    participantes,
    division,
    tipoDivision: esPersonalizada ? "personalizada" : "igual",
    creadoPor,
  };
}

export async function crearGasto(grupoId, datosGasto) {
  const payload = construirPayloadGasto(datosGasto);

  const ref = await addDoc(collection(db, "grupos", grupoId, "gastos"), {
    ...payload,
    creadoEn: serverTimestamp(),
    editadoEn: null,
  });

  return ref.id;
}

export async function editarGasto(grupoId, gastoId, cambios) {
  // Lee el estado actual para validar contra valores completos (no solo lo
  // que llega en `cambios`) y recalcular la división de forma consistente.
  const ref = doc(db, "grupos", grupoId, "gastos", gastoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("El gasto ya no existe.");
  }
  const actual = snap.data();

  const monto = cambios.monto ?? actual.monto;
  const descripcion = cambios.descripcion ?? actual.descripcion;
  const pagadoPor = cambios.pagadoPor ?? actual.pagadoPor;
  const participantes = cambios.participantes ?? actual.participantes ?? [];

  // Validación defensiva, mismo criterio que construirPayloadGasto (alta).
  if (!(monto > 0)) {
    throw new Error("El monto debe ser mayor a cero.");
  }
  if (!descripcion?.trim()) {
    throw new Error("La descripción es obligatoria.");
  }
  if (!participantes.length) {
    throw new Error("Debe haber al menos un participante.");
  }
  if (!participantes.includes(pagadoPor)) {
    throw new Error("Quien paga debe estar incluido entre los participantes.");
  }

  // Si cambió el monto o la composición, recalcular la división en partes
  // iguales para que siempre sume el monto total.
  const division =
    cambios.division ??
    calcularDivisionIgualitaria(monto, participantes);

  await updateDoc(ref, {
    monto,
    descripcion: descripcion.trim(),
    pagadoPor,
    participantes,
    division,
    editadoEn: serverTimestamp(),
  });
}

export async function eliminarGasto(grupoId, gastoId) {
  await deleteDoc(doc(db, "grupos", grupoId, "gastos", gastoId));
}

/** Suscripción en tiempo real a los gastos de un grupo, ordenados por fecha. */
export function suscribirseAGastos(grupoId, callback, onError) {
  const q = query(
    collection(db, "grupos", grupoId, "gastos"),
    orderBy("creadoEn", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const gastos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(gastos);
    },
    (error) => onError?.(error)
  );
}
