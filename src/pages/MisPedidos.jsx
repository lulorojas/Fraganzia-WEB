import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';
import { obtenerPedidoPorId } from '../services/pedidosService';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ESTADO_PEDIDO_INFO, numeroPedido } from '../constants';
import { listarPedidosLocales } from '../utils/misPedidos';
import { formatARS, formatFecha } from '../utils/format';

function FilaPedido({ id }) {
  const { data: pedido, isLoading } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => obtenerPedidoPorId(id),
    staleTime: 30 * 1000,
  });
  const info = pedido ? ESTADO_PEDIDO_INFO[pedido.estado] : null;

  return (
    <li>
      <Link
        to={`/pedido/${id}`}
        className="card-surface card-hover flex items-center gap-4 rounded-2xl p-4"
      >
        <Package size={22} className="flex-shrink-0 text-lila" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-text">Pedido {numeroPedido(id)}</p>
          <p className="font-body text-xs text-text-secondary">
            {isLoading
              ? 'Cargando…'
              : pedido
                ? [formatFecha(pedido.creadoEn), `${pedido.items?.length ?? 0} productos`, formatARS(pedido.totalARS)].join(' · ')
                : 'No disponible'}
          </p>
        </div>
        {info && <span className={`font-body text-sm font-semibold ${info.cls}`}>{info.label}</span>}
        <ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function MisPedidos() {
  useDocumentMeta({ title: 'Mis pedidos', path: '/mis-pedidos' });
  const ids = listarPedidosLocales();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-luxury text-3xl tracking-wide text-text sm:text-4xl">Mis pedidos</h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Los pedidos que hiciste desde este dispositivo. Si compraste desde otro, usá el link
          de seguimiento que quedó en tu mensaje de WhatsApp.
        </p>
      </div>

      {ids.length ? (
        <ul className="flex flex-col gap-3">
          {ids.map((id) => (
            <FilaPedido key={id} id={id} />
          ))}
        </ul>
      ) : (
        <div className="card-surface flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <Package size={32} className="text-lila" aria-hidden="true" />
          <p className="font-body text-text-secondary">Todavía no hiciste pedidos desde este dispositivo.</p>
          <Link to="/catalogo" className="gradient-violet rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-text">
            Ver catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
