import { formatARS } from '../../utils/format';

export function PedidosTable({ pedidos, onVerDetalle }) {
  if (!pedidos?.length) return <p className="text-text-secondary">No hay pedidos todavía.</p>;

  function formatFecha(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Fecha</th>
            <th className="pb-2 pr-4">Cliente</th>
            <th className="pb-2 pr-4">Pago</th>
            <th className="pb-2 pr-4">Total</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="py-2 pr-4 text-text-secondary">{formatFecha(p.createdAt)}</td>
              <td className="py-2 pr-4">{p.clienteNombre}</td>
              <td className="py-2 pr-4">{p.metodoPago}</td>
              <td className="py-2 pr-4 font-luxury">{formatARS(p.totalARS)}</td>
              <td className="py-2">
                <button
                  onClick={() => onVerDetalle(p)}
                  className="text-lila underline text-xs transition-base hover:text-violet-light"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
