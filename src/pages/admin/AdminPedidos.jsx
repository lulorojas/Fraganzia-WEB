import { useState } from 'react';
import { usePedidosList, useActualizarEstadoPedido, useEliminarPedido } from '../../hooks/usePedidos';
import { PedidosTable } from '../../components/admin/PedidosTable';
import { PedidoDetalle } from '../../components/admin/PedidoDetalle';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminPedidos() {
  const { data: pedidos, isLoading } = usePedidosList();
  const { mutate: actualizarEstado } = useActualizarEstadoPedido();
  const { mutate: eliminarPedido } = useEliminarPedido();
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  function handleConfirmar(id) {
    actualizarEstado({ id, estado: 'confirmado' });
  }

  function handleCancelar(id) {
    actualizarEstado({ id, estado: 'cancelado' });
  }

  function handleEliminar(id) {
    if (!window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
    if (pedidoSeleccionado?.id === id) setPedidoSeleccionado(null);
    eliminarPedido(id);
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-xl text-text sm:text-2xl">Pedidos</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <PedidosTable
          pedidos={pedidos}
          onVerDetalle={setPedidoSeleccionado}
          onConfirmar={handleConfirmar}
          onCancelar={handleCancelar}
          onEliminar={handleEliminar}
        />
      )}
      <Modal isOpen={Boolean(pedidoSeleccionado)} onClose={() => setPedidoSeleccionado(null)}>
        <PedidoDetalle pedido={pedidoSeleccionado} onCerrar={() => setPedidoSeleccionado(null)} />
      </Modal>
    </div>
  );
}
