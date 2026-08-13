import { useMemo } from 'react';
import { useVentasSocios } from './useVentasSocios';
import { useVentasDecants } from './useVentasDecants';
import { useCompras } from './useCompras';
import { useGastos } from './useGastos';
import { useMovimientosPersonales } from './useMovimientosPersonales';
import { useTransferenciasSocios } from './useTransferenciasSocios';
import { useCostosProductos } from './useCostosProductos';
import {
  calcularTotalesPorSocio, calcularSaldoNeto, calcularStockPorProducto, calcularValorStock,
} from '../services/panelFinancieroCalculos';

const VACIO = [];

/**
 * Deriva los totales del panel de las mismas queries por colección que usan las
 * pantallas individuales — no vuelve a leer Firestore por su cuenta. Así, tener
 * el dashboard y una pantalla de movimientos abiertos en la misma sesión no
 * duplica lecturas: comparten la misma entrada de caché de TanStack Query.
 */
export function usePanelFinanciero() {
  const ventasSocios = useVentasSocios();
  const ventasDecants = useVentasDecants();
  const compras = useCompras();
  const gastos = useGastos();
  const movimientosPersonales = useMovimientosPersonales();
  const transferenciasSocios = useTransferenciasSocios();
  const costos = useCostosProductos();

  const queries = [ventasSocios, ventasDecants, compras, gastos, movimientosPersonales, transferenciasSocios, costos];
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const data = useMemo(() => {
    const v = ventasSocios.data ?? VACIO;
    const vd = ventasDecants.data ?? VACIO;
    const c = compras.data ?? VACIO;
    const g = gastos.data ?? VACIO;
    const mp = movimientosPersonales.data ?? VACIO;
    const t = transferenciasSocios.data ?? VACIO;
    const co = costos.data ?? VACIO;

    const stockPorProducto = calcularStockPorProducto(c, v);
    const { total: valorStockTotal, porProducto: valorStockPorProducto } = calcularValorStock(stockPorProducto, co);

    const movimientosRecientes = [
      ...v.map((m) => ({ ...m, tipo: 'Venta perfume' })),
      ...vd.map((m) => ({ ...m, tipo: 'Venta decant' })),
      ...c.map((m) => ({ ...m, tipo: 'Compra' })),
      ...g.map((m) => ({ ...m, tipo: 'Gasto' })),
      ...mp.map((m) => ({ ...m, tipo: m.tipo === 'aporte' ? 'Aporte' : 'Retiro' })),
      ...t.map((m) => ({ ...m, tipo: 'Transferencia' })),
    ]
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      .slice(0, 10);

    return {
      totalesPorSocio: calcularTotalesPorSocio({
        movimientosPersonales: mp, ventasSocios: v, ventasDecants: vd, compras: c, gastos: g,
      }),
      saldoNeto: calcularSaldoNeto({
        ventasSocios: v, ventasDecants: vd, compras: c, gastos: g, transferenciasSocios: t,
      }),
      stockPorProducto,
      valorStockTotal,
      valorStockPorProducto,
      movimientosRecientes,
    };
  }, [
    ventasSocios.data, ventasDecants.data, compras.data, gastos.data,
    movimientosPersonales.data, transferenciasSocios.data, costos.data,
  ]);

  return { data, isLoading, error };
}
