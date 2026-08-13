import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

export function StockCard({ stockPorProducto, valorStockTotal, valorStockPorProducto, perfumes }) {
  const entradas = Object.entries(stockPorProducto ?? {});
  const cantidadTotal = entradas.reduce((acc, [, cant]) => acc + cant, 0);
  const nombre = (id) => perfumes?.find((p) => p.id === id)?.nombre ?? id;

  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Stock</h3>
      <p className="font-display text-xl text-text">{cantidadTotal} unidades</p>
      <p className="mb-3 text-sm text-text-secondary">Valor total: {formatARS(valorStockTotal ?? 0)}</p>
      {entradas.length > 0 && (
        <div className="max-h-48 overflow-y-auto text-sm">
          {entradas.map(([perfumeId, cantidad]) => (
            <div key={perfumeId} className="flex justify-between border-b border-border py-1 text-text-secondary">
              <span>{nombre(perfumeId)}</span>
              <span>{cantidad} · {formatARS(valorStockPorProducto?.[perfumeId] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
