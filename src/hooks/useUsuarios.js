import { useMemo } from 'react';
import { usePedidosList } from './usePedidos';

/**
 * Clientes derivados de los pedidos (email único). Reutiliza la query de
 * pedidos del admin (misma caché que la pantalla de Pedidos), en vez de volver
 * a leer toda la colección cada vez que se abre esta pantalla.
 */
export function useUsuarios() {
  const { data: pedidos, isLoading, error } = usePedidosList();

  const usuarios = useMemo(() => {
    const usuariosMap = new Map();

    for (const pedido of pedidos ?? []) {
      if (!pedido.clienteEmail || !pedido.creadoEn) continue; // Skip si falta data

      const usuario = usuariosMap.get(pedido.clienteEmail);
      if (!usuario) {
        usuariosMap.set(pedido.clienteEmail, {
          email: pedido.clienteEmail,
          nombre: pedido.clienteNombre || 'Sin nombre',
          primerPedido: pedido.creadoEn,
          totalPedidos: 1,
          totalGastado: pedido.totalARS || 0,
        });
      } else {
        usuario.totalPedidos += 1;
        usuario.totalGastado += pedido.totalARS || 0;
        // Mantener la fecha más antigua
        if ((pedido.creadoEn.seconds || 0) < (usuario.primerPedido.seconds || 0)) {
          usuario.primerPedido = pedido.creadoEn;
        }
      }
    }

    // Ordenar por fecha de registro (más recientes primero)
    return [...usuariosMap.values()].sort(
      (a, b) => (b.primerPedido?.seconds || 0) - (a.primerPedido?.seconds || 0)
    );
  }, [pedidos]);

  return { usuarios, isLoading, error: error?.message ?? null };
}
