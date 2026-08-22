// hooks/useLoans.js
import { useEffect, useState } from "react";
import { suscribirseAPrestamos } from "../services/loanService";

export function useLoans(grupoId) {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!grupoId) return undefined;
    setCargando(true);
    const unsubscribe = suscribirseAPrestamos(grupoId, (data) => {
      setPrestamos(data);
      setCargando(false);
    });
    return unsubscribe;
  }, [grupoId]);

  return { prestamos, cargando };
}
