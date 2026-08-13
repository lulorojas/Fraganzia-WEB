import { Package } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

export function StockCard({ stockPorProducto, perfumes }) {
  const entradas = Object.entries(stockPorProducto ?? {});
  const cantidadTotal = entradas.reduce((acc, [, cant]) => acc + cant, 0);
  const nombre = (id) => perfumes?.find((p) => p.id === id)?.nombre ?? id;

  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Package className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Stock</h3>
      </div>
      <p className="mb-3 font-display text-xl text-text">{cantidadTotal} unidades</p>
      {entradas.length > 0 && (
        <div className="max-h-48 overflow-y-auto text-sm">
          {entradas.map(([perfumeId, cantidad]) => (
            <div key={perfumeId} className="flex justify-between border-b border-border py-1 text-text-secondary">
              <span>{nombre(perfumeId)}</span>
              <span>{cantidad}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
