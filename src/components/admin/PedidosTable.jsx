import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { formatARS, formatFechaHora } from '../../utils/format';
import { ESTADOS_PEDIDO, ESTADO_PEDIDO_INFO, numeroPedido } from '../../constants';
import { SITE_URL } from '../../hooks/useDocumentMeta';

// Los pedidos se guardan con `creadoEn`; los muy viejos pueden tener `createdAt`.
export const fechaPedido = (p) => p.creadoEn ?? p.createdAt;

function CopiarSeguimiento({ id }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${SITE_URL}/pedido/${id}`);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        } catch {
          window.prompt('Link de seguimiento:', `${SITE_URL}/pedido/${id}`);
        }
      }}
      className="text-lila underline text-xs hover:opacity-75"
    >
      {copiado ? 'Copiado ✓' : 'Link'}
    </button>
  );
}

export function PedidosTable({ pedidos, onVerDetalle, onCambiarEstado, onEliminar }) {
  if (!pedidos?.length) return (
    <GlassCard className="py-10 text-center">
      <p className="font-body text-text-secondary">No hay pedidos todavía.</p>
    </GlassCard>
  );

  return (
    <GlassCard>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Pedido</th>
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
            const info = ESTADO_PEDIDO_INFO[p.estado];
            return (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4 font-mono text-xs text-text-secondary">{numeroPedido(p.id)}</td>
                <td className="py-2 pr-4 text-text-secondary">{formatFechaHora(fechaPedido(p))}</td>
                <td className="py-2 pr-4">{p.clienteNombre}</td>
                <td className="py-2 pr-4">{p.metodoPago}</td>
                <td className="py-2 pr-4 font-luxury">{formatARS(p.totalARS)}</td>
                <td className="py-2 pr-4">
                  {/* Cambia lo que ve el cliente en su link de seguimiento. */}
                  <select
                    value={p.estado}
                    onChange={(e) => onCambiarEstado(p.id, e.target.value)}
                    aria-label={`Estado del pedido ${numeroPedido(p.id)}`}
                    className={`rounded-lg border border-border bg-bg px-2 py-1 text-xs font-medium ${info?.cls ?? 'text-text'}`}
                  >
                    {!ESTADOS_PEDIDO.includes(p.estado) && <option value={p.estado}>{info?.label ?? p.estado}</option>}
                    {ESTADOS_PEDIDO.map((e) => (
                      <option key={e} value={e}>{ESTADO_PEDIDO_INFO[e].label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onVerDetalle(p)}
                      className="text-lila underline text-xs hover:opacity-75"
                    >
                      Ver
                    </button>
                    <CopiarSeguimiento id={p.id} />
                    <button
                      type="button"
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
