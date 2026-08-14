import { X } from 'lucide-react';
import { formatARS } from '../../utils/format';

export function CartItem({ item, precioARS, onCambiarCantidad, onQuitar }) {
  const imagenUrl = item.imagenes?.[0] || 'https://via.placeholder.com/80';

  return (
    <div className="glass relative flex items-center gap-3 rounded-xl p-3 pr-8">
      {/* Imagen del producto */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5F2FB] sm:h-20 sm:w-20">
        <img
          src={imagenUrl}
          alt={item.nombre}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-text font-medium truncate">{item.marca}</p>
        <p className="text-xs text-text-secondary line-clamp-2 sm:line-clamp-1">{item.nombre}</p>
        <p className="mt-1 text-sm text-lila font-medium">{formatARS(precioARS)} c/u</p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onCambiarCantidad(item.perfumeId, Math.max(1, item.cantidad - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text transition-base hover:bg-violet/10"
        >
          -
        </button>
        <span className="w-5 text-center text-sm text-text font-medium">{item.cantidad}</span>
        <button
          onClick={() => onCambiarCantidad(item.perfumeId, item.cantidad + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text transition-base hover:bg-violet/10"
        >
          +
        </button>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={() => onQuitar(item.perfumeId)}
        className="absolute top-2 right-2 text-text-secondary hover:text-error transition-base"
        aria-label="Quitar del carrito"
      >
        <X size={16} />
      </button>
    </div>
  );
}
