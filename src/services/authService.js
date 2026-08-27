// services/authService.js
// Toda la lógica de autenticación vive acá. Los componentes solo llaman
// funciones de este módulo, nunca tocan `firebase/auth` directamente.

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { validarInvitacion, consumirInvitacion } from "./invitationService";

const googleProvider = new GoogleAuthProvider();

/**
 * Login con Google. Lo usan tanto quien crea un grupo como quien entra
 * por un enlace de invitación (ver unirseComoInvitado más abajo).
 * Crea (o actualiza) el documento en /usuarios.
 */
export async function iniciarSesionConGoogle() {
  const credencial = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email, photoURL } = credencial.user;

  await upsertPerfilUsuario({
    uid,
    nombre: displayName ?? "Usuario",
    email,
    foto: photoURL,
    esAnonimo: false,
  });

  return credencial.user;
}

/**
 * Alta de un invitado a través de un token de invitación temporal.
 * El invitado se identifica con SU PROPIA cuenta de Google (ya no hay
 * acceso anónimo): abre sesión con Google igual que el creador del
 * grupo, y si el token es válido queda agregado a ese grupo puntual sin
 * perder la posibilidad de crear o pertenecer a otros grupos propios.
 *
 * @param {string} token - token de /invitaciones/{token}
 */
export async function unirseComoInvitado(token) {
  const invitacion = await validarInvitacion(token);
  if (!invitacion.valida) {
    throw new Error(invitacion.motivo ?? "Invitación inválida o expirada");
  }

  const credencial = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email, photoURL } = credencial.user;

  await upsertPerfilUsuario({
    uid,
    nombre: displayName ?? "Usuario",
    email,
    foto: photoURL,
    esAnonimo: false,
  });

  // Si ya era miembro de este grupo (ej. abrió el enlace de nuevo), no
  // hace falta gastar un uso de la invitación.
  if (!invitacion.miembrosActuales?.includes(uid)) {
    await consumirInvitacion(token, uid, invitacion.grupoId);
  }

  return { user: credencial.user, grupoId: invitacion.grupoId };
}

async function upsertPerfilUsuario({ uid, nombre, email, foto, esAnonimo }) {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      nombre,
      email,
      foto,
      esAnonimo,
      gruposIds: [],
      creadoEn: serverTimestamp(),
      ultimaConexion: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { ultimaConexion: serverTimestamp() });
  }
}

/** Cierra sesión (funciona igual para cuentas Google y anónimas). */
export function cerrarSesion() {
  return signOut(auth);
}

/**
 * Suscripción al estado de auth. Devuelve función de unsubscribe.
 * Uso típico: dentro de un hook (ver hooks/useAuthState.js).
 */
export function suscribirseAEstadoAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
