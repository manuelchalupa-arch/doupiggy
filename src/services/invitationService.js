// services/invitationService.js
// Gestión de enlaces de invitación temporales usados para el alta anónima
// de invitados a un grupo (ver Bloque 2).

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const DIAS_EXPIRACION_DEFAULT = 7;

function generarToken() {
  // Token URL-safe, suficiente entropía para un enlace temporal (no es un secreto
  // de larga duración: expira y además el grupo no es accesible sin ser miembro).
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Crea una invitación temporal para un grupo. Debe ejecutarse autenticado
 * como el creador del grupo (lo validan las reglas de seguridad).
 */
export async function crearInvitacion(grupoId, creadorUid, opciones = {}) {
  const token = generarToken();
  const dias = opciones.diasValidez ?? DIAS_EXPIRACION_DEFAULT;
  const expiraEn = Timestamp.fromMillis(Date.now() + dias * 24 * 60 * 60 * 1000);

  await setDoc(doc(db, "invitaciones", token), {
    grupoId,
    creadoPor: creadorUid,
    expiraEn,
    usosMaximos: opciones.usosMaximos ?? null,
    usosActuales: 0,
    creadoEn: serverTimestamp(),
  });

  return { token, expiraEn };
}

/** Valida que el token exista, no haya expirado y tenga cupo disponible. */
export async function validarInvitacion(token) {
  const ref = doc(db, "invitaciones", token);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { valida: false, motivo: "El enlace de invitación no existe." };
  }

  const datos = snap.data();
  const ahora = Timestamp.now();

  if (datos.expiraEn.toMillis() < ahora.toMillis()) {
    return { valida: false, motivo: "El enlace de invitación expiró." };
  }

  if (datos.usosMaximos !== null && datos.usosActuales >= datos.usosMaximos) {
    return { valida: false, motivo: "El enlace alcanzó su límite de usos." };
  }

  return { valida: true, grupoId: datos.grupoId };
}

/**
 * Consume un uso de la invitación y agrega al usuario al grupo de forma atómica.
 * Se usa una transacción para evitar condiciones de carrera si dos invitados
 * usan el mismo enlace al mismo tiempo cerca del límite de usos.
 */
export async function consumirInvitacion(token, uidNuevoMiembro, grupoId) {
  const invitacionRef = doc(db, "invitaciones", token);
  const grupoRef = doc(db, "grupos", grupoId);
  const usuarioRef = doc(db, "usuarios", uidNuevoMiembro);

  await runTransaction(db, async (tx) => {
    // Todas las lecturas de una transacción deben hacerse antes de cualquier escritura.
    const [invitacionSnap, usuarioSnap] = await Promise.all([
      tx.get(invitacionRef),
      tx.get(usuarioRef),
    ]);

    if (!invitacionSnap.exists()) {
      throw new Error("La invitación ya no existe.");
    }
    const datos = invitacionSnap.data();

    if (datos.usosMaximos !== null && datos.usosActuales >= datos.usosMaximos) {
      throw new Error("El enlace alcanzó su límite de usos.");
    }

    const nombreInvitado = usuarioSnap.exists()
      ? usuarioSnap.data().nombre
      : "Invitado";

    tx.update(invitacionRef, { usosActuales: increment(1) });

    tx.update(grupoRef, {
      miembros: arrayUnion(uidNuevoMiembro),
      [`miembrosInfo.${uidNuevoMiembro}`]: { nombre: nombreInvitado, foto: null, activo: true },
      actualizadoEn: serverTimestamp(),
    });

    tx.update(usuarioRef, { gruposIds: arrayUnion(grupoId) });
  });
}
