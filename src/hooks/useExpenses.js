// hooks/useExpenses.js
import { useEffect, useState } from "react";
import { suscribirseAGastos } from "../services/expenseService";

export function useExpenses(grupoId) {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!grupoId) return undefined;
    setCargando(true);
    const unsubscribe = suscribirseAGastos(grupoId, (data) => {
      setGastos(data);
      setCargando(false);
    });
    return unsubscribe;
  }, [grupoId]);

  return { gastos, cargando };
}
