// hooks/useExpenses.js
import { useEffect, useState } from "react";
import { suscribirseAGastos } from "../services/expenseService";

export function useExpenses(grupoId) {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!grupoId) return undefined;
    setCargando(true);
    setError(null);
    const unsubscribe = suscribirseAGastos(
      grupoId,
      (data) => {
        setGastos(data);
        setCargando(false);
      },
      (err) => {
        setError(err);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, [grupoId]);

  return { gastos, cargando, error };
}
