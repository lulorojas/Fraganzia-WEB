import { Package } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

export function StockCard({ stockPorProducto, porCobrar, socios, perfumes }) {
  const entradas = Object.entries(stockPorProducto ?? {}).filter(([, cant]) => cant > 0);
  const cantidadTotal = entradas.reduce((acc, [, cant]) => acc + cant, 0);
  const nombre = (id) => perfumes?.find((p) => p.id === id)?.nombre ?? id;

  const sinCotizacion = porCobrar?.sinCotizacion;
  const sinPrecio = porCobrar?.sinPrecio?.length ?? 0;

  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Package className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Stock</h3>
      </div>

      <p className="font-display text-xl text-text">{cantidadTotal} unidades</p>

      {sinCotizacion ? (
        <p className="mt-1 text-xs text-text-secondary">
          Sin cotización del dólar no se puede calcular cuánto queda por cobrar.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-text-secondary">
            Por cobrar si se vende todo:{' '}
            <span className="font-luxury text-base text-success">{formatARS(porCobrar?.total ?? 0)}</span>
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {socios?.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-2 text-center">
                <p className="text-xs text-text-secondary">{s.nombre}</p>
                <p className="font-luxury text-base text-text">
                  {formatARS(porCobrar?.porSocio?.[s.id] ?? 0)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-text-secondary">
            A precio de lista por transferencia; en efectivo entra un 5% menos. Se reparte 50/50.
          </p>

          {sinPrecio > 0 && (
            <p className="mt-1 text-xs text-error">
              {sinPrecio} {sinPrecio === 1 ? 'perfume' : 'perfumes'} con stock sin precio de
              catálogo: no {sinPrecio === 1 ? 'está' : 'están'} incluido{sinPrecio === 1 ? '' : 's'} en el total.
            </p>
          )}
        </>
      )}

      {entradas.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto text-sm">
          {entradas.map(([perfumeId, cantidad]) => (
            <div key={perfumeId} className="flex items-center justify-between gap-2 border-b border-border py-1">
              <span className="min-w-0 truncate text-text-secondary">{nombre(perfumeId)}</span>
              <span className="shrink-0 text-right">
                <span className="text-text">{cantidad}</span>
                {!sinCotizacion && porCobrar?.porProducto?.[perfumeId] != null && (
                  <span className="ml-2 text-xs text-text-secondary">
                    {formatARS(porCobrar.porProducto[perfumeId])}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
