import { useMemo } from 'react';
import { useCompras } from './useCompras';
import { useVentasSocios } from './useVentasSocios';
import { useAjustesStock } from './useAjustesStock';
import { calcularStockPorProducto } from '../services/panelFinancieroCalculos';

const VACIO = [];

// Stock vigente por perfume. Comparte caché con el resto del panel: no agrega lecturas.
export function useStock() {
  const compras = useCompras();
  const ventas = useVentasSocios();
  const ajustes = useAjustesStock();
  const stock = useMemo(
    () => calcularStockPorProducto(compras.data ?? VACIO, ventas.data ?? VACIO, ajustes.data ?? VACIO),
    [compras.data, ventas.data, ajustes.data]
  );
  return { stock, isLoading: compras.isLoading || ventas.isLoading || ajustes.isLoading };
}
