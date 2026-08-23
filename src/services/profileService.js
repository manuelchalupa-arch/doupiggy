// services/profileService.js
// Extiende el perfil de /usuarios/{uid} con los datos de cobro (CBU/alias)
// que se muestran y editan en la pestaña de Información.

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Valida el formato básico de un CBU argentino (22 dígitos numéricos).
 * No valida el dígito verificador: alcanza para evitar errores de tipeo
 * obvios sin bloquear al usuario con una regla demasiado estricta.
 */
export function esCbuValido(cbu) {
  return /^\d{22}$/.test((cbu ?? "").trim());
}

export function esAliasValido(alias) {
  return (alias ?? "").trim().length >= 6;
}

/**
 * Actualiza nombre, correo (solo visual, no cambia el de auth) y los datos
 * de cobro del usuario. CBU y alias son mutuamente opcionales: alcanza con
 * completar uno de los dos para poder recibir pagos, pero el que se
 * complete tiene que tener un formato válido.
 */
export async function actualizarPerfil(uid, { nombre, correoContacto, cbu, alias }) {
  const cbuLimpio = (cbu ?? "").trim();
  const aliasLimpio = (alias ?? "").trim();

  if (!cbuLimpio && !aliasLimpio) {
    throw new Error("Completá al menos un dato de cobro: CBU o alias.");
  }
  if (cbuLimpio && !esCbuValido(cbuLimpio)) {
    throw new Error("El CBU debe tener 22 dígitos.");
  }
  if (aliasLimpio && !esAliasValido(aliasLimpio)) {
    throw new Error("El alias debe tener al menos 6 caracteres.");
  }

  await updateDoc(doc(db, "usuarios", uid), {
    nombre,
    correoContacto,
    datosCobro: { cbu: cbuLimpio || null, alias: aliasLimpio || null },
  });
}
