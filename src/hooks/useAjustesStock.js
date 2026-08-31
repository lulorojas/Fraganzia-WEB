import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearAjuste, editarAjuste, anularAjuste } from '../services/ajustesStockService';

export function useAjustesStock() {
  return useQuery({
    queryKey: ['ajustesStock'],
    queryFn: () => listarMovimientos('ajustesStock'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarAjustes() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['ajustesStock'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearAjusteStock() {
  const invalidar = useInvalidarAjustes();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearAjuste(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarAjusteStock() {
  const invalidar = useInvalidarAjustes();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarAjuste(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularAjusteStock() {
  const invalidar = useInvalidarAjustes();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularAjuste(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
