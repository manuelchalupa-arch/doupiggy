// services/groupService.js
// CRUD de grupos. La membresía se maneja siempre desde acá para mantener
// sincronizados `grupos.miembros` y `usuarios.gruposIds`.

import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Crea un grupo nuevo. El creador queda automáticamente como miembro.
 */
export async function crearGrupo({ nombre, creadoPor, nombreCreador, fotoCreador, aliasCreador = null, cbuCreador = null }) {
  const ref = doc(collection(db, "grupos"));

  await setDoc(ref, {
    nombre,
    moneda: "ARS",
    creadoPor,
    miembros: [creadoPor],
    miembrosInfo: {
      [creadoPor]: {
        nombre: nombreCreador,
        foto: fotoCreador ?? null,
        activo: true,
        alias: aliasCreador,
        cbu: cbuCreador,
      },
    },
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });

  await updateDoc(doc(db, "usuarios", creadoPor), {
    gruposIds: arrayUnion(ref.id),
  });

  return ref.id;
}

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
      // `desdeCache` dice si esta lista salió SOLO de la caché local (todavía
      // no llegó la confirmación del servidor). La UI la usa para NO concluir
      // "no tenés grupos" cuando la caché está vacía (típico al abrir la app
      // instalada recién instalada o sin conexión), evitando mandar a quien ya
      // es miembro de un grupo a la pantalla de "crear grupo".
      callback(grupos, snapshot.metadata.fromCache);
    },
    (error) => {
      console.error("Error al suscribirse a los grupos del usuario:", error);
      onError?.(error);
    }
  );
}

/**
 * Agrega un miembro LOCAL/temporal al grupo: alguien que participa de los
 * gastos (se le puede asignar "pagó" o incluir en "dividir entre") sin
 * tener cuenta de Google ni pasar por invitación — pensado para gente que
 * no usa la app pero igual hay que trackear cuánto puso o cuánto debe.
 *
 * Se identifica con un id sintético "local:<random>" (nunca puede
 * coincidir con un uid real de Firebase Auth) y se marca con esLocal:true
 * en miembrosInfo para poder diferenciarlo en la UI de los miembros reales
 * (invitados por Google). Lo hace quien ya es miembro real del grupo — las
 * reglas de Firestore ya permiten que cualquier miembro actualice el
 * documento del grupo, así que no hace falta ningún permiso nuevo.
 *
 * @returns {string} el id local recién creado
 */
export async function agregarMiembroLocal(grupoId, nombre) {
  const idLocal = `local:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await updateDoc(doc(db, "grupos", grupoId), {
    miembros: arrayUnion(idLocal),
    [`miembrosInfo.${idLocal}`]: { nombre, esLocal: true, foto: null, activo: true },
    actualizadoEn: serverTimestamp(),
  });
  return idLocal;
}

/**
 * Saca a un miembro LOCAL del grupo (nunca a uno real: por diseño esta
 * función solo se llama desde la UI para ids que empiezan con "local:").
 * No borra los gastos ya cargados en los que haya participado — quedan
 * con su nombre histórico dentro de cada gasto, solo deja de aparecer
 * como opción para gastos nuevos.
 */
export async function eliminarMiembroLocal(grupoId, idLocal) {
  await updateDoc(doc(db, "grupos", grupoId), {
    miembros: arrayRemove(idLocal),
    [`miembrosInfo.${idLocal}`]: deleteField(),
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Borra un grupo entero: sus gastos y el documento del grupo.
 *
 * Firestore no borra subcolecciones en cascada, así que primero se recorren
 * los gastos y se eliminan uno por uno, y recién después el doc del grupo.
 *
 * NOTA: las reglas solo permiten BORRAR el grupo a su creador, y solo
 * permiten escribir `usuarios/{uid}` a su dueño. Por eso acá NO se tocan
 * los docs de `usuarios` de los demás miembros: un `gruposIds` huérfano es
 * inofensivo porque el doc del grupo ya no existe (la suscripción de grupos
 * usa `miembros` array-contains, no esa lista). La UI exhibe el botón solo
 * al creador.
 */
export async function eliminarGrupo(grupoId) {
  const gastosSnap = await getDocs(collection(db, "grupos", grupoId, "gastos"));
  await Promise.all(gastosSnap.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, "grupos", grupoId));
}
