import { formatARS } from '../../utils/format';
import { Button } from '../ui/Button';

export function PedidoDetalle({ pedido, onCerrar }) {
  if (!pedido) return null;

  function formatFecha(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('es-AR');
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-text-secondary text-sm">{formatFecha(pedido.createdAt)}</p>
          <h3 className="font-display text-xl text-text">{pedido.clienteNombre}</h3>
          <p className="text-text-secondary text-sm">Método: {pedido.metodoPago}</p>
          <p className="text-sm mt-1">
            Estado:{' '}
            <span className={pedido.estado === 'confirmado' ? 'text-success' : pedido.estado === 'cancelado' ? 'text-error' : 'text-yellow-400'}>
              {pedido.estado === 'en_proceso' ? 'En proceso' : pedido.estado === 'confirmado' ? 'Confirmado' : pedido.estado === 'cancelado' ? 'Cancelado' : pedido.estado}
            </span>
          </p>
        </div>
        <Button variant="ghost" onClick={onCerrar}>✕</Button>
      </div>

      <div className="flex flex-col gap-2">
        {pedido.items?.map((item, i) => (
          <div key={i} className="flex justify-between border-b border-border py-2">
            <div>
              <p className="text-text">{item.marca} — {item.nombre}</p>
              <p className="text-text-secondary text-xs">{item.cantidad} u. × {formatARS(item.precioARS)}</p>
            </div>
            <p className="font-luxury text-text">{formatARS(item.precioARS * item.cantidad)}</p>
          </div>
        ))}
      </div>

      <div className="text-right font-luxury text-text">
        <p className="text-text-secondary text-sm">Subtotal: {formatARS(pedido.subtotalARS)}</p>
        {pedido.descuentoARS > 0 && (
          <p className="text-success text-sm">Descuento: -{formatARS(pedido.descuentoARS)}</p>
        )}
        <p className="text-xl">Total: {formatARS(pedido.totalARS)}</p>
        <p className="text-text-secondary text-xs">
          Dólar blue usado: ${pedido.dolarBlueUsado?.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
