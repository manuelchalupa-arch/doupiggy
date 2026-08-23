// services/groupService.js
// CRUD de grupos. La membresía se maneja siempre desde acá para mantener
// sincronizados `grupos.miembros` y `usuarios.gruposIds`.

import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Crea un grupo nuevo. El creador queda automáticamente como miembro.
 */
export async function crearGrupo({ nombre, creadoPor, nombreCreador, fotoCreador }) {
  const ref = doc(collection(db, "grupos"));

  await setDoc(ref, {
    nombre,
    moneda: "ARS",
    creadoPor,
    miembros: [creadoPor],
    miembrosInfo: {
      [creadoPor]: { nombre: nombreCreador, foto: fotoCreador ?? null, activo: true },
    },
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });

  await updateDoc(doc(db, "usuarios", creadoPor), {
    gruposIds: arrayUnion(ref.id),
  });

  return ref.id;
}

/** Lectura puntual de un grupo (uso típico: validar antes de mostrar UI). */
export async function obtenerGrupo(grupoId) {
  const snap = await getDoc(doc(db, "grupos", grupoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Suscripción en tiempo real a un grupo. Gracias al caché de IndexedDB
 * configurado en firebaseConfig.js, esto funciona offline: primero emite
 * los datos cacheados y luego los actualiza cuando hay red.
 */
export function suscribirseAGrupo(grupoId, callback) {
  return onSnapshot(doc(db, "grupos", grupoId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/**
 * Suscripción a todos los grupos donde el usuario es miembro.
 * Usa `miembros` (array-contains) en vez de `usuarios.gruposIds` para que
 * quede validado también por las reglas de seguridad al leer.
 */
/**
 * Suscripción a todos los grupos donde el usuario es miembro.
 * Usa `miembros` (array-contains) en vez de `usuarios.gruposIds` para que
 * quede validado también por las reglas de seguridad al leer.
 *
 * @param {(error: Error) => void} [onError] - se dispara si Firestore
 * rechaza la suscripción (típicamente: reglas de seguridad sin publicar).
 * Sin esto, un error de permisos queda "colgado" en silencio para siempre.
 */
export function suscribirseAGruposDeUsuario(uid, callback, onError) {
  const q = query(collection(db, "grupos"), where("miembros", "array-contains", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const grupos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(grupos);
    },
    (error) => {
      console.error("Error al suscribirse a los grupos del usuario:", error);
      onError?.(error);
    }
  );
}

export async function renombrarGrupo(grupoId, nuevoNombre) {
  await updateDoc(doc(db, "grupos", grupoId), {
    nombre: nuevoNombre,
    actualizadoEn: serverTimestamp(),
  });
}
