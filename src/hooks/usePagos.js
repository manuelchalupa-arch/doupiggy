// hooks/usePagos.js
import { useEffect, useState } from "react";
import { suscribirseAPagos } from "../services/pagoService";

export function usePagos(grupoId) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!grupoId) return undefined;
    setCargando(true);
    setError(null);
    const unsubscribe = suscribirseAPagos(
      grupoId,
      (data) => {
        setPagos(data);
        setCargando(false);
      },
      (err) => {
        setError(err);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, [grupoId]);

  return { pagos, cargando, error };
}