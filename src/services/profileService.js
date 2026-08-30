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
 * Actualiza nombre, correo (solo visual, no cambia el de auth), los datos
 * de cobro del usuario y, opcionalmente, la foto de perfil. CBU y alias
 * son mutuamente opcionales: alcanza con completar uno de los dos para
 * poder recibir pagos, pero el que se complete tiene que tener un formato
 * válido. `foto` es opcional: si no se pasa, no se toca el valor guardado.
 */
export async function actualizarPerfil(uid, { nombre, correoContacto, cbu, alias, foto }) {
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

  const datos = {
    nombre,
    correoContacto,
    datosCobro: { cbu: cbuLimpio || null, alias: aliasLimpio || null },
  };
  if (foto !== undefined) datos.foto = foto;

  await updateDoc(doc(db, "usuarios", uid), datos);
}

/**
 * Guarda solo la foto de perfil (avatar preset o imagen propia ya
 * convertida a un data URL comprimido — ver comprimirImagenComoDataUrl en
 * InfoProfile.jsx). Separado de actualizarPerfil para poder cambiar el
 * avatar sin pasar por la validación de CBU/alias del formulario grande.
 */
export async function actualizarFotoPerfil(uid, foto) {
  await updateDoc(doc(db, "usuarios", uid), { foto });
}

/**
 * Guarda (o quita, pasando null) el ícono personalizado de UNA pestaña de
 * navegación. Se guarda dentro de perfil.iconosTab.{clave} (clave =
 * "inicio" | "gastos" | "liquidacion" | "pagos" | "info") como data URL comprimido,
 * igual que la foto de perfil — mismo motivo: sin Firebase Storage.
 */
export async function actualizarIconoTab(uid, clave, dataUrl) {
  await updateDoc(doc(db, "usuarios", uid), { [`iconosTab.${clave}`]: dataUrl });
}
