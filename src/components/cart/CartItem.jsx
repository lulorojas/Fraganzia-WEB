import { Minus, Plus, X } from 'lucide-react';
import { formatARS } from '../../utils/format';
import { webpSrc } from '../../utils/image';
import { CANTIDAD_MAX } from '../../context/CartContext';

export function CartItem({ item, precioARS, onCambiarCantidad, onQuitar }) {
  const imagenUrl = item.imagenes?.[0] || '/placeholder-perfume.svg';
  const nombreCompleto = `${item.marca} ${item.nombre}`;

  return (
    <li className="card-surface relative flex items-center gap-3 rounded-xl p-3 pr-12">
      {/* Imagen del producto */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white sm:h-20 sm:w-20">
        <picture>
          {webpSrc(imagenUrl) && <source srcSet={webpSrc(imagenUrl)} type="image/webp" />}
          <img
            src={imagenUrl}
            alt=""
            width="80"
            height="80"
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-text font-medium truncate">{item.marca}</p>
        <p className="text-xs text-text-secondary line-clamp-2 sm:line-clamp-1">{item.nombre}</p>
        <p className="mt-1 text-sm text-lila font-medium tabular-nums">{formatARS(precioARS)} c/u</p>
      </div>

      {/* Controles de cantidad: 44px de área táctil */}
      <div className="flex items-center flex-shrink-0 rounded-xl border border-border" role="group" aria-label={`Cantidad de ${nombreCompleto}`}>
        <button
          type="button"
          onClick={() => onCambiarCantidad(item.perfumeId, Math.max(1, item.cantidad - 1))}
          disabled={item.cantidad <= 1}
          aria-label={`Restar una unidad de ${nombreCompleto}`}
          className="flex h-11 w-9 items-center justify-center text-text transition-base hover:text-lila disabled:opacity-40"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm text-text font-medium tabular-nums" aria-live="polite">
          {item.cantidad}
        </span>
        <button
          type="button"
          onClick={() => onCambiarCantidad(item.perfumeId, Math.min(CANTIDAD_MAX, item.cantidad + 1))}
          disabled={item.cantidad >= CANTIDAD_MAX}
          aria-label={`Sumar una unidad de ${nombreCompleto}`}
          className="flex h-11 w-9 items-center justify-center text-text transition-base hover:text-lila disabled:opacity-40"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={() => onQuitar(item.perfumeId)}
        className="absolute top-1 right-1 flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:text-error transition-base"
        aria-label={`Quitar ${nombreCompleto} del carrito`}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  );
}
