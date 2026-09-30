import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ImagenProducto } from '../perfumes/ImagenProducto';
import { preciosPorMetodo } from '../../utils/precios';
import { formatARS } from '../../utils/format';

function precioUnitario(item, dolarMedio, metodoPago) {
  if (!dolarMedio || !item.precioUSD) return null;
  const { precioTransferencia, precioEfectivo } = preciosPorMetodo(item.precioUSD, dolarMedio);
  return metodoPago === 'Efectivo' ? precioEfectivo : precioTransferencia;
}

export default function PanelMiniCarrito({ agregado, onCerrar }) {
  const { state } = useCart();
  const { dolarMedio } = useDolarBlue();
  const panelRef = useRef(null);
  const tituloId = useId();
  const abierto = Boolean(agregado);

  // Foco en "Ir al carrito" (la acción más probable), Escape cierra.
  useFocusTrap(panelRef, abierto, onCerrar, { enfocar: '[data-principal]' });

  if (!abierto) return null;

  const item = state.items.find((i) => i.perfumeId === agregado.perfumeId);
  const unidades = state.items.reduce((acc, i) => acc + i.cantidad, 0);
  const subtotal = state.items.reduce((acc, i) => {
    const precio = precioUnitario(i, dolarMedio, state.metodoPago);
    return precio == null ? acc : acc + precio * i.cantidad;
  }, 0);

  return (
    <div className="fixed inset-0 z-[60]" onClick={onCerrar}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" aria-hidden="true" />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass-frosted animate-hoja absolute inset-x-0 bottom-0 rounded-b-none p-5 pb-6 focus:outline-none sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-[380px] sm:rounded-b-[20px] sm:animate-panel"
      >
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-400" aria-hidden="true" />
          <h2 id={tituloId} className="flex-1 font-display text-base font-semibold text-text">
            Agregado al carrito
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {item && (
          <div className="card-surface flex items-center gap-3 rounded-2xl p-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white">
              <ImagenProducto url={item.imagenes?.[0]} sizes="64px" width="64" height="64" className="h-full w-full object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[11px] font-semibold uppercase tracking-wide2 text-lila">{item.marca}</p>
              <p className="line-clamp-2 font-display text-sm font-semibold leading-snug text-text">{item.nombre}</p>
              <p className="mt-0.5 font-body text-xs text-text-secondary">
                {agregado.cantidad > 1 ? `${agregado.cantidad} unidades` : '1 unidad'}
                {item.cantidad > agregado.cantidad && ` · ${item.cantidad} en total`}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-baseline justify-between font-body text-sm">
          <span className="text-text-secondary">
            Subtotal ({unidades} {unidades === 1 ? 'producto' : 'productos'})
          </span>
          <span className="font-semibold tabular-nums text-text">{subtotal ? formatARS(subtotal) : '—'}</span>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            to="/carrito"
            data-principal=""
            className="gradient-violet flex-1 rounded-xl px-4 py-3 text-center font-body text-sm font-semibold text-text shadow-lg shadow-violet/20 transition-shadow hover:shadow-violet/40"
          >
            Ir al carrito
          </Link>
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl border border-violet/30 px-4 py-3 font-body text-sm font-semibold text-text transition-colors hover:border-violet"
          >
            Seguir comprando
          </button>
        </div>
      </section>
    </div>
  );
}
