import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarMovimientos } from '../services/movimientosService';
import { crearCompra, editarCompra, anularCompra } from '../services/comprasService';

export function useCompras() {
  return useQuery({
    queryKey: ['compras'],
    queryFn: () => listarMovimientos('compras'),
    staleTime: 60 * 1000,
  });
}

function useInvalidarCompras() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['compras'] });
    qc.invalidateQueries({ queryKey: ['costosProductos'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearCompra() {
  const invalidar = useInvalidarCompras();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearCompra(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarCompra() {
  const invalidar = useInvalidarCompras();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarCompra(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularCompra() {
  const invalidar = useInvalidarCompras();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularCompra(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
