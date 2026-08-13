import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearVentaDecant, editarVentaDecant, anularVentaDecant } from '../services/ventasDecantsService';

export function useVentasDecants() {
  return useQuery({
    queryKey: ['ventasDecants'],
    queryFn: () => listarMovimientos('ventasDecants'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarVentasDecants() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['ventasDecants'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearVentaDecant() {
  const invalidar = useInvalidarVentasDecants();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearVentaDecant(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarVentaDecant() {
  const invalidar = useInvalidarVentasDecants();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarVentaDecant(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularVentaDecant() {
  const invalidar = useInvalidarVentasDecants();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularVentaDecant(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
