import { useMemo } from 'react';
import { useVentasSocios } from './useVentasSocios';
import { useVentasDecants } from './useVentasDecants';
import { useCompras } from './useCompras';
import { useGastos } from './useGastos';
import { useAjustesStock } from './useAjustesStock';
import { calcularGananciaPorCompra } from '../services/panelFinancieroCalculos';

const VACIO = [];

// Deriva de las mismas queries por colección que el resto del panel — comparte
// caché en vez de releer Firestore. Los cálculos por mes se hacen en la pantalla
// (analyticsCalculos) porque dependen del mes que elija el usuario.
export function useAnalytics() {
  const ventasSocios = useVentasSocios();
  const ventasDecants = useVentasDecants();
  const compras = useCompras();
  const gastos = useGastos();
  const ajustesStock = useAjustesStock();

  const queries = [ventasSocios, ventasDecants, compras, gastos, ajustesStock];
  const isLoading = queries.some((q) => q.isLoading);

  const data = useMemo(() => {
    const v = ventasSocios.data ?? VACIO;
    const vd = ventasDecants.data ?? VACIO;
    const c = compras.data ?? VACIO;
    const g = gastos.data ?? VACIO;
    const aj = ajustesStock.data ?? VACIO;
    return {
      movimientos: { ventasSocios: v, ventasDecants: vd, compras: c, gastos: g, ajustesStock: aj },
      gananciaPorCompra: calcularGananciaPorCompra(c, v, aj),
    };
  }, [ventasSocios.data, ventasDecants.data, compras.data, gastos.data, ajustesStock.data]);

  return { data, isLoading };
}
