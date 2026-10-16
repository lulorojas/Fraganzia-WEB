import { useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, MessageCircle, PackageX } from 'lucide-react';
import { obtenerPedidoPorId } from '../services/pedidosService';
import { useConfig } from '../hooks/useConfig';
import { useDocumentMeta, SITE_URL } from '../hooks/useDocumentMeta';
import { ESTADO_PEDIDO_INFO, WHATSAPP_NUMERO, numeroPedido } from '../constants';
import { construirLinkWhatsApp, mensajeNuevoPedido } from '../utils/whatsapp';
import { formatARS, formatFechaHora, nombreCompleto } from '../utils/format';
import { Spinner } from '../components/ui/Spinner';

// Los pasos que ve el cliente. 'en_proceso' (estado viejo) cuenta como preparando.
const PASOS = ['confirmado', 'preparando', 'enviado', 'entregado'];
const pasoDe = (estado) => (estado === 'en_proceso' ? 'preparando' : estado);

function LineaDeTiempo({ pedido }) {
  const actual = PASOS.indexOf(pasoDe(pedido.estado));
  const historial = pedido.historial ?? {};

  return (
    <ol className="flex flex-col gap-0">
      {PASOS.map((paso, i) => {
        const hecho = i <= actual;
        const esActual = i === actual;
        const fecha = paso === 'confirmado' ? pedido.creadoEn : historial[paso] ?? (paso === 'preparando' ? historial.en_proceso : null);
        return (
          <li key={paso} className="flex gap-4" aria-current={esActual ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  hecho ? 'border-violet bg-violet text-white' : 'border-border text-text-secondary'
                } ${esActual ? 'ring-4 ring-violet/25' : ''}`}
              >
                {hecho ? <Check size={16} aria-hidden="true" /> : <span className="text-xs">{i + 1}</span>}
              </span>
              {i < PASOS.length - 1 && (
                <span className={`my-1 h-8 w-0.5 ${i < actual ? 'bg-violet' : 'bg-border'}`} aria-hidden="true" />
              )}
            </div>
            <div className="pb-4 pt-1">
              <p className={`font-body text-sm font-semibold ${hecho ? 'text-text' : 'text-text-secondary'}`}>
                {ESTADO_PEDIDO_INFO[paso].label}
                <span className="sr-only">{hecho ? ' (completado)' : ' (pendiente)'}</span>
              </p>
              {esActual && <p className="mt-0.5 font-body text-xs text-text-secondary">{ESTADO_PEDIDO_INFO[paso].detalle}</p>}
              {hecho && fecha && <p className="mt-0.5 font-body text-xs text-text-secondary">{formatFechaHora(fecha)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Pedido() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state } = useLocation();
  const esNuevo = params.get('nuevo') === '1';
  const { data: config } = useConfig();
  const [copiado, setCopiado] = useState(false);

  const { data: pedido, isLoading, isError } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => obtenerPedidoPorId(id),
    // Recién creado: se muestra al instante con lo que mandó el carrito.
    initialData: state?.pedido ? { id, ...state.pedido } : undefined,
    initialDataUpdatedAt: 0,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const numero = numeroPedido(id);
  useDocumentMeta({ title: `Pedido ${numero}`, path: `/pedido/${id}` });

  const urlSeguimiento = `${SITE_URL}/pedido/${id}`;
  const whatsapp = config?.whatsappNumero || WHATSAPP_NUMERO;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Si la lectura falla pero hay datos del carrito (recién creado), se muestra igual.
  if (!pedido || (isError && !pedido.items)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-surface flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <PackageX size={36} className="text-lila" aria-hidden="true" />
          <h1 className="font-display text-2xl text-text">No encontramos ese pedido</h1>
          <p className="font-body text-sm text-text-secondary">
            Revisá que el link esté completo, o escribinos por WhatsApp con tu número de pedido.
          </p>
          <a
            href={construirLinkWhatsApp(whatsapp, `Hola! Quiero consultar por mi pedido ${numero}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-violet rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-text"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const info = ESTADO_PEDIDO_INFO[pedido.estado] ?? { label: pedido.estado, cls: 'text-text' };
  const cancelado = pedido.estado === 'cancelado';
  const linkEnviar = construirLinkWhatsApp(whatsapp, mensajeNuevoPedido(pedido, id, urlSeguimiento));
  const linkConsulta = construirLinkWhatsApp(whatsapp, `Hola! Quiero consultar por mi pedido ${numero}: ${urlSeguimiento}`);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(urlSeguimiento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el link igual está en la barra de direcciones.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-luxury text-3xl tracking-wide text-text sm:text-4xl">Pedido {numero}</h1>
        <p className="mt-1 font-body text-sm text-text-secondary">
          {pedido.clienteNombre}
          {pedido.creadoEn && ` · ${formatFechaHora(pedido.creadoEn)}`}
        </p>
      </div>

      {esNuevo && !cancelado && (
        <section className="card-surface mb-6 rounded-2xl p-5 ring-1 ring-violet/50" aria-labelledby="ultimo-paso">
          <h2 id="ultimo-paso" className="font-display text-lg font-semibold text-text">
            ¡Listo! Falta un último paso
          </h2>
          <p className="mt-1 font-body text-sm text-text-secondary">
            Mandanos el pedido por WhatsApp para coordinar el pago y la entrega. Este link
            queda guardado en el mensaje y en <Link to="/mis-pedidos" className="text-lila underline">Mis pedidos</Link>.
          </p>
          <a
            href={linkEnviar}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-body text-sm font-bold text-[#06231a] transition-opacity hover:opacity-90"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Enviar pedido por WhatsApp
          </a>
        </section>
      )}

      <section className="card-surface mb-6 rounded-2xl p-5" aria-labelledby="estado">
        <h2 id="estado" className="mb-4 font-body text-sm text-text-secondary">
          Estado: <span className={`font-semibold ${info.cls}`}>{info.label}</span>
        </h2>
        {cancelado ? (
          <p className="font-body text-sm text-text-secondary">{info.detalle}</p>
        ) : (
          <LineaDeTiempo pedido={pedido} />
        )}
      </section>

      <section className="card-surface mb-6 rounded-2xl p-5" aria-labelledby="detalle">
        <h2 id="detalle" className="mb-3 font-display text-lg text-text">Detalle</h2>
        <ul className="divide-y divide-border">
          {pedido.items?.map((item, i) => (
            <li key={`${item.perfumeId}-${i}`} className="flex justify-between gap-4 py-2.5 font-body text-sm">
              <span className="text-text">
                {item.cantidad}× {nombreCompleto(item)}
              </span>
              <span className="shrink-0 tabular-nums text-text-secondary">{formatARS(item.precioARS * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-border pt-3 font-body text-sm tabular-nums">
          {pedido.descuentoARS > 0 && (
            <p className="flex justify-between text-emerald-400">
              <span>Descuento</span>
              <span>−{formatARS(pedido.descuentoARS)}</span>
            </p>
          )}
          <p className="flex justify-between text-base font-semibold text-text">
            <span>Total ({pedido.metodoPago})</span>
            <span>{formatARS(pedido.totalARS)}</span>
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <a
          href={linkConsulta}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-violet/30 px-4 py-2.5 font-body text-sm font-semibold text-text transition-colors hover:border-violet"
        >
          <MessageCircle size={16} aria-hidden="true" />
          Consultar por este pedido
        </a>
        <button
          type="button"
          onClick={copiarLink}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm text-text-secondary transition-colors hover:text-text"
        >
          {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copiado ? 'Link copiado' : 'Copiar link de seguimiento'}
        </button>
      </div>
    </div>
  );
}
