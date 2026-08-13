import { useMemo } from 'react';
import { useVentasSocios } from './useVentasSocios';
import { useVentasDecants } from './useVentasDecants';
import { useCompras } from './useCompras';
import { useGastos } from './useGastos';
import { useMovimientosPersonales } from './useMovimientosPersonales';
import { useTransferenciasSocios } from './useTransferenciasSocios';
import {
  calcularRankingPerfumes, calcularEvolucionVentas, calcularIngresoTotal, calcularActividadPorSocio,
} from '../services/panelFinancieroCalculos';

const VACIO = [];

// Deriva de las mismas queries por colección que el resto del panel — comparte
// caché con el dashboard en vez de releer Firestore.
export function useAnalytics() {
  const ventasSocios = useVentasSocios();
  const ventasDecants = useVentasDecants();
  const compras = useCompras();
  const gastos = useGastos();
  const movimientosPersonales = useMovimientosPersonales();
  const transferenciasSocios = useTransferenciasSocios();

  const queries = [ventasSocios, ventasDecants, compras, gastos, movimientosPersonales, transferenciasSocios];
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const data = useMemo(() => {
    const v = ventasSocios.data ?? VACIO;
    const vd = ventasDecants.data ?? VACIO;

    return {
      rankingPerfumes: calcularRankingPerfumes(v),
      evolucionVentas: calcularEvolucionVentas(v, vd),
      ingresoTotal: calcularIngresoTotal(v, vd),
      actividadPorSocio: calcularActividadPorSocio({
        ventasSocios: v,
        ventasDecants: vd,
        compras: compras.data ?? VACIO,
        gastos: gastos.data ?? VACIO,
        movimientosPersonales: movimientosPersonales.data ?? VACIO,
        transferenciasSocios: transferenciasSocios.data ?? VACIO,
      }),
      ventasDecants: vd,
    };
  }, [
    ventasSocios.data, ventasDecants.data, compras.data, gastos.data,
    movimientosPersonales.data, transferenciasSocios.data,
  ]);

  return { data, isLoading, error };
}
