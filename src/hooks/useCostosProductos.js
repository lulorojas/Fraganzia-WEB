import { useQuery } from '@tanstack/react-query';
import { obtenerCostos } from '../services/costosProductosService';

export function useCostosProductos() {
  return useQuery({
    queryKey: ['costosProductos'],
    queryFn: obtenerCostos,
    staleTime: 60 * 1000,
  });
}
