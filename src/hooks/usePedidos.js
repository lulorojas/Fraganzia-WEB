import { useMutation, useQuery } from '@tanstack/react-query';
import { crearPedido, listarPedidos, obtenerPedidoPorId } from '../services/pedidosService';

export function useCrearPedido() {
  return useMutation({ mutationFn: crearPedido });
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
