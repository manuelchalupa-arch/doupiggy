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
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID().replace(/-/g, "");
  }
  // Fallback para navegadores sin randomUUID (Safari < 15.4 / iOS < 15.4):
  // uuid v4 en 32 hex, mismo formato y entropía que el caso principal.
  const bytes = new Uint8Array(16);
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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

/**
 * Valida que el token exista, no haya expirado y tenga cupo disponible.
 * NO lee el documento del grupo: las reglas de seguridad exigen ser miembro
 * para leer `/grupos/{grupoId}`, y quien recibe la invitación todavía no lo
 * es. La membresía se determina en authService desde el perfil propio del
 * usuario (`usuarios/{uid}.gruposIds`), que siempre puede leer.
 */
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
 *
 * El update al grupo incluye `ultimaInvitacionToken` (el token usado). Es lo
 * que le permite a las reglas de seguridad (firebase/firestore.rules)
 * verificar, con un get() a /invitaciones/{token}, que quien se está
 * agregando a sí mismo lo hace citando una invitación real y vigente para
 * ESE grupo puntual — sin eso, un usuario no-miembro no podría escribir en
 * /grupos/{grupoId} en absoluto (ver función esAltaPorInvitacionValida en
 * las reglas).
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
    const datosCobroInvitado = usuarioSnap.exists()
      ? (usuarioSnap.data().datosCobro ?? {})
      : {};
    // También se copian los datos de cobro al doc del grupo: las reglas no
    // permiten leer /usuarios a los demás miembros, así que el alias/CBU
    // tiene que estar adentro de miembrosInfo para que aparezca en la
    // liquidación del grupo.
    const aliasInvitado = datosCobroInvitado.alias ?? null;
    const cbuInvitado = datosCobroInvitado.cbu ?? null;

    tx.update(invitacionRef, { usosActuales: increment(1) });

    tx.update(grupoRef, {
      miembros: arrayUnion(uidNuevoMiembro),
      [`miembrosInfo.${uidNuevoMiembro}`]: {
        nombre: nombreInvitado,
        foto: null,
        activo: true,
        alias: aliasInvitado,
        cbu: cbuInvitado,
      },
      actualizadoEn: serverTimestamp(),
      ultimaInvitacionToken: token,
    });

    tx.update(usuarioRef, { gruposIds: arrayUnion(grupoId) });
  });
}
