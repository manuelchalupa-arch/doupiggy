// services/authService.js
// Toda la lógica de autenticación vive acá. Los componentes solo llaman
// funciones de este módulo, nunca tocan `firebase/auth` directamente.

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile,
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
    proveedor: "google",
  });

  return credencial.user;
}

/**
 * Registro con correo electrónico + contraseña. Además de la cuenta de
 * Firebase crea/actualiza el documento en /usuarios (nombre, email y foto).
 */
export async function registrarseConEmail({ email, password, nombre }) {
  const credencial = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credencial.user, { displayName: nombre });
  await upsertPerfilUsuario({
    uid: credencial.user.uid,
    nombre,
    email,
    foto: null,
    esAnonimo: false,
    proveedor: "email",
  });
  return credencial.user;
}

/**
 * Login con correo electrónico + contraseña.
 */
export async function iniciarSesionConEmail({ email, password }) {
  const credencial = await signInWithEmailAndPassword(auth, email, password);
  const { uid, displayName, email: correo, photoURL } = credencial.user;
  await upsertPerfilUsuario({
    uid,
    nombre: displayName ?? "Usuario",
    email: correo,
    foto: photoURL,
    esAnonimo: false,
    proveedor: "email",
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
 * ORDEN CRÍTICO (reglas de seguridad): primero se autentica con Google y
 * recién después se valida el token leyendo Firestore. Las reglas exigen
 * `request.auth != null` para leer `/invitaciones/{token}`, así que validar
 * antes de abrir sesión siempre fallaba con permission-denied para quien
 * entra por primera vez. Además, para saber si ya era miembro se consulta
 * su PROPIO perfil (`usuarios/{uid}.gruposIds`), que siempre puede leer,
 * en vez del doc del grupo (cuya lectura exige ser miembro).
 *
 * @param {string} token - token de /invitaciones/{token}
 */
export async function unirseComoInvitado(token) {
  const credencial = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email, photoURL } = credencial.user;

  await upsertPerfilUsuario({
    uid,
    nombre: displayName ?? "Usuario",
    email,
    foto: photoURL,
    esAnonimo: false,
    proveedor: "google",
  });

  const invitacion = await validarInvitacion(token);
  if (!invitacion.valida) {
    throw new Error(invitacion.motivo ?? "Invitación inválida o expirada");
  }

  // Si ya era miembro de este grupo (ej. abrió el enlace de nuevo), no
  // hace falta gastar un uso de la invitación.
  const perfilSnap = await getDoc(doc(db, "usuarios", uid));
  const yaEsMiembro = (perfilSnap.data()?.gruposIds ?? []).includes(invitacion.grupoId);
  if (!yaEsMiembro) {
    await consumirInvitacion(token, uid, invitacion.grupoId);
  }

  return { user: credencial.user, grupoId: invitacion.grupoId };
}

/**
 * Traduce códigos de error comunes de Firebase Auth a mensajes en español
 * que el usuario puede entender y corregir (pantalla de login y aceptación
 * de invitaciones). Para códigos desconocidos devuelve el mensaje crudo.
 */
export function traducirErrorLogin(err) {
  const mensajes = {
    "auth/popup-blocked":
      "Tu navegador bloqueó la ventana de acceso. Permití las ventanas emergentes para este sitio y volvé a intentar.",
    "auth/popup-closed-by-user": "Se canceló el acceso con Google.",
    "auth/cancelled-popup-request": "Se canceló el acceso con Google.",
    "auth/unauthorized-domain":
      "Este sitio no está autorizado para usar el login de Google. Agregá su dominio en Firebase Console > Authentication > Authorized domains.",
    "auth/network-request-failed":
      "No hay conexión a Internet. Revisá tu conexión y volvé a intentar.",
    "auth/operation-not-allowed":
      "Ese método de acceso está desactivado en Firebase. Activá Google o Correo/contraseña en Authentication > Sign-in method.",
    "auth/account-exists-with-different-credential":
      "Ya existe una cuenta con ese correo pero con otro método de acceso.",
    "auth/invalid-credential": "Correo o contraseña incorrectos. Revisá los datos o pedí restablecer tu contraseña.",
    "auth/timeout": "La operación tardó demasiado. Volvé a intentar.",
    "auth/web-storage-unsupported":
      "Este navegador no permite guardar la sesión (modo privado o navegador embebido). Abrí el enlace en Safari o Chrome y volvé a intentar.",
    "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
    "permission-denied":
      "Firestore rechazó el pedido por permisos. Revisá que publicaste las reglas de seguridad (firebase/firestore.rules) en Firebase Console > Firestore Database > Rules.",
    "auth/missing-password": "Escribí tu contraseña.",
    "auth/invalid-login-credentials":
      "Correo o contraseña incorrectos. Revisá los datos o pedí restablecer tu contraseña.",
    "auth/user-not-found": "No existe una cuenta con ese correo. ¿Querés crear una?",
    "auth/wrong-password": "Contraseña incorrecta. Volvé a intentar.",
    "auth/email-already-in-use":
      "Ya existe una cuenta con ese correo. Ingresá con tu contraseña o usá Google.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar.",
  };
  return mensajes[err?.code] ?? (err?.message ?? "No se pudo iniciar sesión. Volvé a intentar.");
}

async function upsertPerfilUsuario({ uid, nombre, email, foto, esAnonimo, proveedor }) {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      nombre,
      email,
      foto: foto ?? null,
      esAnonimo,
      proveedor,
      gruposIds: [],
      creadoEn: serverTimestamp(),
      ultimaConexion: serverTimestamp(),
    });
  } else {
    // Re-login: siempre se actualiza el email (fuente de verdad de auth) y
    // la última conexión. El nombre solo se propaga si falta, para no pisar
    // un nombre que la persona editó en Cuenta > Tu perfil. La foto de
    // Google solo se sincroniza si la guardada no es un avatar custom
    // (preset:..., data:...) ni una URL vieja de Google; así un cambio de
    // foto de la cuenta se refleja sin reemplazar un avatar elegido a mano.
    const datos = snap.data();
    const cambios = { ultimaConexion: serverTimestamp() };
    if (proveedor) cambios.proveedor = proveedor;
    if (email && !datos.email) cambios.email = email;
    if (nombre && !datos.nombre) cambios.nombre = nombre;
    const fotoGuardada = datos.foto;
    if (
      foto &&
      (!fotoGuardada ||
        String(fotoGuardada).startsWith("preset:") ||
        String(fotoGuardada).startsWith("data:") ||
        String(fotoGuardada).startsWith("http"))
    ) {
      cambios.foto = foto;
    }
    await updateDoc(ref, cambios);
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
