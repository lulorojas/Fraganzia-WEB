import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crearPedido, listarPedidos, obtenerPedidoPorId, actualizarEstadoPedido, eliminarPedido } from '../services/pedidosService';

export function useCrearPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearPedido,
    onSuccess: (pedidoId) => {
      console.log('✅ usePedidos - onSuccess ejecutado, ID:', pedidoId);
      qc.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function usePedidosList() {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: listarPedidos,
    staleTime: 30 * 1000,
  });
}

export function usePedidoDetalle(id) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => obtenerPedidoPorId(id),
    enabled: Boolean(id),
  });
}

function useInvalidarPedidos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['pedidos'] });
}

export function useActualizarEstadoPedido() {
  const invalidar = useInvalidarPedidos();
  return useMutation({
    mutationFn: ({ id, estado }) => actualizarEstadoPedido(id, estado),
    onSuccess: invalidar,
  });
}

export function useEliminarPedido() {
  const invalidar = useInvalidarPedidos();
  return useMutation({
    mutationFn: (id) => eliminarPedido(id),
    onSuccess: invalidar,
  });
}
