import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearCambio, anularCambio } from '../services/cambiosMetodoService';

export function useCambiosMetodo() {
  return useQuery({
    queryKey: ['cambiosMetodo'],
    queryFn: () => listarMovimientos('cambiosMetodo'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarCambios() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['cambiosMetodo'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearCambioMetodo() {
  const invalidar = useInvalidarCambios();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearCambio(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularCambioMetodo() {
  const invalidar = useInvalidarCambios();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularCambio(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
