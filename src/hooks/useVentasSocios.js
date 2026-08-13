import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearVenta, editarVenta, anularVenta } from '../services/ventasSociosService';

export function useVentasSocios() {
  return useQuery({
    queryKey: ['ventasSocios'],
    queryFn: () => listarMovimientos('ventasSocios'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarVentasSocios() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['ventasSocios'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearVenta() {
  const invalidar = useInvalidarVentasSocios();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearVenta(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarVenta() {
  const invalidar = useInvalidarVentasSocios();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarVenta(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularVenta() {
  const invalidar = useInvalidarVentasSocios();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularVenta(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
