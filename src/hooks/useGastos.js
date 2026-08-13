import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearGasto, editarGasto, anularGasto } from '../services/gastosService';

export function useGastos() {
  return useQuery({
    queryKey: ['gastos'],
    queryFn: () => listarMovimientos('gastos'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarGastos() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['gastos'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearGasto() {
  const invalidar = useInvalidarGastos();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearGasto(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarGasto() {
  const invalidar = useInvalidarGastos();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarGasto(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularGasto() {
  const invalidar = useInvalidarGastos();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularGasto(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
