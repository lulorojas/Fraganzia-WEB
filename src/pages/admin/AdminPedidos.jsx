import { useState } from 'react';
import { usePedidosList } from '../../hooks/usePedidos';
import { PedidosTable } from '../../components/admin/PedidosTable';
import { PedidoDetalle } from '../../components/admin/PedidoDetalle';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminPedidos() {
  const { data: pedidos, isLoading } = usePedidosList();
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Pedidos</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <PedidosTable pedidos={pedidos} onVerDetalle={setPedidoSeleccionado} />
      )}
      <Modal isOpen={Boolean(pedidoSeleccionado)} onClose={() => setPedidoSeleccionado(null)}>
        <PedidoDetalle pedido={pedidoSeleccionado} onCerrar={() => setPedidoSeleccionado(null)} />
      </Modal>
    </div>
  );
}
