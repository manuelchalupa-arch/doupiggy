// hooks/usePagos.js
import { useEffect, useState } from "react";
import { suscribirseAPagos } from "../services/pagoService";

export function usePagos(grupoId) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!grupoId) return undefined;
    setCargando(true);
    const unsubscribe = suscribirseAPagos(grupoId, (data) => {
      setPagos(data);
      setCargando(false);
    });
    return unsubscribe;
  }, [grupoId]);

  return { pagos, cargando };
}