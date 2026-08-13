import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearTransferencia, editarTransferencia, anularTransferencia } from '../services/transferenciasSociosService';

export function useTransferenciasSocios() {
  return useQuery({
    queryKey: ['transferenciasSocios'],
    queryFn: () => listarMovimientos('transferenciasSocios'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarTransferencias() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['transferenciasSocios'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearTransferencia() {
  const invalidar = useInvalidarTransferencias();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearTransferencia(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarTransferencia() {
  const invalidar = useInvalidarTransferencias();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarTransferencia(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularTransferencia() {
  const invalidar = useInvalidarTransferencias();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularTransferencia(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
