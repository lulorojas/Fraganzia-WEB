import { useMemo } from 'react';
import { useVentasSocios } from './useVentasSocios';
import { useVentasDecants } from './useVentasDecants';
import { useCompras } from './useCompras';
import { useGastos } from './useGastos';
import {
  calcularRankingPerfumes, calcularEvolucionVentas, calcularIngresoTotal, calcularActividadPorSocio,
  calcularEvolucionGanancia, calcularGananciaPorCompra,
} from '../services/panelFinancieroCalculos';

const VACIO = [];

// Deriva de las mismas queries por colección que el resto del panel — comparte
// caché en vez de releer Firestore. Suma compras y gastos porque la ganancia
// real necesita el costo de lo vendido, no solo la facturación.
export function useAnalytics() {
  const ventasSocios = useVentasSocios();
  const ventasDecants = useVentasDecants();
  const compras = useCompras();
  const gastos = useGastos();

  const queries = [ventasSocios, ventasDecants, compras, gastos];
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const data = useMemo(() => {
    const v = ventasSocios.data ?? VACIO;
    const vd = ventasDecants.data ?? VACIO;
    const c = compras.data ?? VACIO;
    const g = gastos.data ?? VACIO;

    return {
      rankingPerfumes: calcularRankingPerfumes(v),
      evolucionVentas: calcularEvolucionVentas(v, vd),
      ingresoTotal: calcularIngresoTotal(v, vd),
      actividadPorSocio: calcularActividadPorSocio({ ventasSocios: v, ventasDecants: vd }),
      ventasDecants: vd,
      evolucionGanancia: calcularEvolucionGanancia({
        ventasSocios: v, ventasDecants: vd, compras: c, gastos: g,
      }),
      ganancia: calcularGananciaPorCompra(c, v),
    };
  }, [ventasSocios.data, ventasDecants.data, compras.data, gastos.data]);

  return { data, isLoading, error };
}
