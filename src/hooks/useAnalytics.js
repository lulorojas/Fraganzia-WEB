import { useMemo } from 'react';
import { useVentasSocios } from './useVentasSocios';
import { useVentasDecants } from './useVentasDecants';
import {
  calcularRankingPerfumes, calcularEvolucionVentas, calcularIngresoTotal, calcularActividadPorSocio,
} from '../services/panelFinancieroCalculos';

const VACIO = [];

// Solo necesita ventas (perfumes + decants). Deriva de las mismas queries por
// colección que el resto del panel — comparte caché en vez de releer Firestore.
export function useAnalytics() {
  const ventasSocios = useVentasSocios();
  const ventasDecants = useVentasDecants();

  const isLoading = ventasSocios.isLoading || ventasDecants.isLoading;
  const error = ventasSocios.error ?? ventasDecants.error ?? null;

  const data = useMemo(() => {
    const v = ventasSocios.data ?? VACIO;
    const vd = ventasDecants.data ?? VACIO;

    return {
      rankingPerfumes: calcularRankingPerfumes(v),
      evolucionVentas: calcularEvolucionVentas(v, vd),
      ingresoTotal: calcularIngresoTotal(v, vd),
      actividadPorSocio: calcularActividadPorSocio({ ventasSocios: v, ventasDecants: vd }),
      ventasDecants: vd,
    };
  }, [ventasSocios.data, ventasDecants.data]);

  return { data, isLoading, error };
}
