// services/authService.js
// Toda la lógica de autenticación vive acá. Los componentes solo llaman
// funciones de este módulo, nunca tocan `firebase/auth` directamente.

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
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
 * Login con Google, reservado para creadores de grupo.
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
 * Acceso anónimo para invitados a través de un token de invitación temporal.
 * Valida el token, crea sesión anónima, crea el perfil y agrega al usuario
 * al grupo correspondiente.
 *
 * @param {string} token - token de /invitaciones/{token}
 * @param {string} nombreInvitado - nombre visible que elige el invitado
 */
export async function unirseComoInvitado(token, nombreInvitado) {
  const invitacion = await validarInvitacion(token);
  if (!invitacion.valida) {
    throw new Error(invitacion.motivo ?? "Invitación inválida o expirada");
  }

  const credencial = await signInAnonymously(auth);
  const { uid } = credencial.user;

  await upsertPerfilUsuario({
    uid,
    nombre: nombreInvitado || "Invitado",
    email: null,
    foto: null,
    esAnonimo: true,
  });

  await consumirInvitacion(token, uid, invitacion.grupoId);

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
