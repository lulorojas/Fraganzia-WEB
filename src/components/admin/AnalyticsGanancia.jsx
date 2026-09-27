import { TrendingUp, Percent, PackageCheck } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { formatARS } from '../../utils/format';

function Titulo({ Icon, children, sub }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Icon className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">{children}</h3>
      </div>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

/**
 * Ganancia real por mes. La barra se dibuja sobre el mayor valor absoluto para
 * que un mes en rojo se vea con el mismo peso visual que uno en verde.
 */
export function AnalyticsGananciaMensual({ evolucion }) {
  const max = Math.max(1, ...(evolucion ?? []).map((m) => Math.abs(m.ganancia)));
  const total = (evolucion ?? []).reduce((acc, m) => acc + m.ganancia, 0);

  return (
    <GlassCard>
      <Titulo Icon={TrendingUp} sub="Lo que entró menos el costo de lo vendido y los gastos del mes">
        Ganancia real por mes
      </Titulo>

      {!evolucion?.length ? (
        <p className="text-sm text-text-secondary">Todavía no hay ventas cargadas.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-text-secondary">
            Ganancia acumulada:{' '}
            <span className={`font-luxury text-base ${total >= 0 ? 'text-success' : 'text-error'}`}>
              {formatARS(total)}
            </span>
          </p>
          <div className="flex flex-col gap-3">
            {evolucion.map((m) => (
              <div key={m.mes}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-text-secondary">{m.mes}</span>
                  <div className="h-2 flex-1 rounded-full bg-white/5">
                    <div
                      className={`h-2 rounded-full ${m.ganancia >= 0 ? 'gradient-violet' : 'bg-error'}`}
                      style={{ width: `${(Math.abs(m.ganancia) / max) * 100}%` }}
                    />
                  </div>
                  <span className={`w-28 shrink-0 text-right ${m.ganancia >= 0 ? 'text-text' : 'text-error'}`}>
                    {formatARS(m.ganancia)}
                  </span>
                </div>
                <p className="ml-[4.75rem] mt-0.5 text-xs text-text-secondary">
                  entró {formatARS(m.ingreso)} · costo {formatARS(m.costoVendido)}
                  {m.gastos > 0 && ` · gastos ${formatARS(m.gastos)}`}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            Comprar stock no cuenta como pérdida: esa plata no se perdió, se convirtió en
            mercadería. Su costo pesa recién cuando esa mercadería se vende.
          </p>
        </>
      )}
    </GlassCard>
  );
}

export function AnalyticsMargen({ ganancia }) {
  const margen = ganancia?.margenPromedioPct;
  const hayDatos = margen != null;

  return (
    <GlassCard>
      <Titulo Icon={Percent} sub="De cada $100 que entran por una venta, cuánto queda de ganancia">
        Margen promedio
      </Titulo>

      {!hayDatos ? (
        <p className="text-sm text-text-secondary">
          Todavía no hay ventas con una compra que las respalde.
        </p>
      ) : (
        <>
          <p className={`font-display text-3xl ${margen >= 0 ? 'text-success' : 'text-error'}`}>
            {margen.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Vendiste {formatARS(ganancia.ingresoTotal)} y ganaste {formatARS(ganancia.gananciaTotal)}.
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            Es margen sobre la venta, ponderado por facturación: una compra grande pesa más que
            una chica.
          </p>
          {ganancia.unidadesSinCosto > 0 && (
            <p className="mt-2 text-xs text-error">
              {ganancia.unidadesSinCosto} {ganancia.unidadesSinCosto === 1 ? 'unidad vendida' : 'unidades vendidas'} sin
              una compra cargada que las respalde ({formatARS(ganancia.ingresoSinCosto)}). No entran
              en el margen porque no se sabe qué costaron.
            </p>
          )}
        </>
      )}
    </GlassCard>
  );
}

export function AnalyticsGananciaPorCompra({ ganancia }) {
  const detalle = ganancia?.detalle ?? [];

  function fechaCorta(f) {
    const d = f?.toDate ? f.toDate() : new Date(f);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR');
  }

  return (
    <GlassCard>
      <Titulo Icon={PackageCheck} sub="Cuánto dejó cada compra según lo que ya se vendió de ella">
        Ganancia por compra
      </Titulo>

      {!detalle.length ? (
        <p className="text-sm text-text-secondary">Todavía no hay compras cargadas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {detalle.map((c) => (
            <div key={c.compraId} className="border-b border-border pb-2 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-text">
                  {c.proveedor} <span className="text-text-secondary">· {fechaCorta(c.fecha)}</span>
                </span>
                <span className={`shrink-0 text-sm ${c.ganancia >= 0 ? 'text-success' : 'text-text-secondary'}`}>
                  {c.unidadesVendidas > 0 ? formatARS(c.ganancia) : '—'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-secondary">
                <span>costó {formatARS(c.montoTotal)}</span>
                <span>vendidas {c.unidadesVendidas}/{c.unidades}</span>
                <span>recuperado {c.recuperadoPct.toFixed(0)}%</span>
                {c.margenPct != null && <span>margen {c.margenPct.toFixed(1)}%</span>}
                {c.vendidoTodo && <span className="text-success">vendida entera</span>}
              </div>
            </div>
          ))}
          <p className="text-xs text-text-secondary">
            Mientras una compra no se venda entera, la ganancia es la de las unidades ya vendidas:
            lo que queda en stock todavía no ganó ni perdió nada.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
