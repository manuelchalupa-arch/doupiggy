// hooks/useAuthState.js
// Expone el usuario autenticado (Google o anónimo) y su perfil de Firestore.

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { suscribirseAEstadoAuth } from "../services/authService";

export function useAuthState() {
  const [usuarioAuth, setUsuarioAuth] = useState(undefined); // undefined = cargando
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = suscribirseAEstadoAuth((user) => {
      setUsuarioAuth(user ?? null);
      if (!user) {
        setPerfil(null);
        setCargando(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!usuarioAuth) return undefined;

    const unsubscribePerfil = onSnapshot(
      doc(db, "usuarios", usuarioAuth.uid),
      (snap) => {
        setPerfil(snap.exists() ? snap.data() : null);
        setCargando(false);
      },
      () => setCargando(false)
    );

    return unsubscribePerfil;
  }, [usuarioAuth]);

  return {
    usuario: usuarioAuth ?? null,
    perfil,
    estaAutenticado: !!usuarioAuth,
    esAnonimo: usuarioAuth?.isAnonymous ?? false,
    cargando,
  };
}
