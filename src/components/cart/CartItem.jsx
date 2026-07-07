import { Button } from '../ui/Button';
import { formatARS } from '../../utils/format';

export function CartItem({ item, precioARS, onCambiarCantidad, onQuitar }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div>
        <p className="font-body text-text">{item.marca} — {item.nombre}</p>
        <p className="text-sm text-text-secondary">{formatARS(precioARS)} c/u</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onCambiarCantidad(item.perfumeId, Math.max(1, item.cantidad - 1))}
          className="rounded-lg border border-border px-2 text-text"
        >
          -
        </button>
        <span className="text-text">{item.cantidad}</span>
        <button
          onClick={() => onCambiarCantidad(item.perfumeId, item.cantidad + 1)}
          className="rounded-lg border border-border px-2 text-text"
        >
          +
        </button>
        <Button variant="ghost" onClick={() => onQuitar(item.perfumeId)}>
          Quitar
        </Button>
      </div>
    </div>
  );
}
