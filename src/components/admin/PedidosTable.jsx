import { GlassCard } from '../ui/GlassCard';
import { formatARS } from '../../utils/format';

const ESTADO_BADGE = {
  en_proceso: { label: 'En proceso', cls: 'text-yellow-400' },
  confirmado: { label: 'Confirmado', cls: 'text-success' },
  cancelado: { label: 'Cancelado', cls: 'text-error' },
};

export function PedidosTable({ pedidos, onVerDetalle, onConfirmar, onCancelar, onEliminar }) {
  if (!pedidos?.length) return (
    <GlassCard className="py-10 text-center">
      <p className="font-body text-text-secondary">No hay pedidos todavía.</p>
    </GlassCard>
  );

  function formatFecha(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <GlassCard>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Fecha</th>
            <th className="pb-2 pr-4">Cliente</th>
            <th className="pb-2 pr-4">Pago</th>
            <th className="pb-2 pr-4">Total</th>
            <th className="pb-2 pr-4">Estado</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => {
            const badge = ESTADO_BADGE[p.estado] ?? { label: p.estado ?? '—', cls: 'text-text-secondary' };
            return (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4 text-text-secondary">{formatFecha(p.createdAt)}</td>
                <td className="py-2 pr-4">{p.clienteNombre}</td>
                <td className="py-2 pr-4">{p.metodoPago}</td>
                <td className="py-2 pr-4 font-luxury">{formatARS(p.totalARS)}</td>
                <td className={`py-2 pr-4 text-xs font-medium ${badge.cls}`}>{badge.label}</td>
                <td className="py-2">
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => onVerDetalle(p)}
                      className="text-lila underline text-xs hover:opacity-75"
                    >
                      Ver
                    </button>
                    {p.estado === 'en_proceso' && (
                      <button
                        onClick={() => onConfirmar(p.id)}
                        className="text-success underline text-xs hover:opacity-75"
                      >
                        Confirmar
                      </button>
                    )}
                    {p.estado !== 'cancelado' && (
                      <button
                        onClick={() => onCancelar(p.id)}
                        className="text-yellow-400 underline text-xs hover:opacity-75"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="text-error underline text-xs hover:opacity-75"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
