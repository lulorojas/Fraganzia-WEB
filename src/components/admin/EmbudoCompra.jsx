import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '../ui/GlassCard';
import { listarEmbudo, PASOS } from '../../services/embudoService';

const ETIQUETAS = {
  sesiones: 'Sesiones',
  catalogo: 'Catálogo',
  ficha: 'Ficha',
  carrito: 'Carrito',
  checkout: 'Revisó el pedido',
  pedidos: 'Pedidos',
};
const DIAS = 30;

/** Recorrido de compra de los últimos 30 días, por fuente de la visita. */
export function EmbudoCompra() {
  const { data, isLoading, error } = useQuery({ queryKey: ['embudo'], queryFn: () => listarEmbudo(), staleTime: 60_000 });

  const filas = useMemo(() => {
    const corte = new Date(Date.now() - DIAS * 24 * 3600e3).toISOString().slice(0, 10);
    const porFuente = new Map();
    for (const d of data ?? []) {
      if (d.fecha < corte) continue;
      const f = porFuente.get(d.fuente) ?? Object.fromEntries(PASOS.map((p) => [p, 0]));
      for (const p of PASOS) f[p] += d[p] ?? 0;
      porFuente.set(d.fuente, f);
    }
    const total = Object.fromEntries(PASOS.map((p) => [p, 0]));
    const lista = [...porFuente.entries()]
      .map(([fuente, f]) => {
        PASOS.forEach((p) => (total[p] += f[p]));
        return { fuente, ...f };
      })
      .sort((a, b) => b.sesiones - a.sesiones);
    return { lista, total };
  }, [data]);

  const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—');

  return (
    <GlassCard className="overflow-x-auto p-0">
      <div className="p-4">
        <h2 className="font-display text-lg text-text">Del ingreso al pedido (últimos {DIAS} días)</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Cuántas sesiones llegaron a cada paso, según de dónde vinieron. Cada paso cuenta una vez por sesión.
          Empieza a registrarse desde que se publicó esta función.
        </p>
      </div>
      {isLoading ? (
        <p className="px-4 pb-4 text-sm text-text-secondary">Cargando…</p>
      ) : error ? (
        <p className="px-4 pb-4 text-sm text-error">No se pudo cargar el recorrido.</p>
      ) : !filas.lista.length ? (
        <p className="px-4 pb-4 text-sm text-text-secondary">Todavía no hay datos.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Fuente</th>
              {PASOS.map((p) => (
                <th key={p} className="px-3 py-3 text-right font-medium">{ETIQUETAS[p]}</th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Compraron</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {[...filas.lista, { fuente: 'Total', ...filas.total }].map((f) => (
              <tr key={f.fuente} className={`border-t border-border ${f.fuente === 'Total' ? 'font-semibold text-text' : ''}`}>
                <td className="px-4 py-2 text-text">{f.fuente}</td>
                {PASOS.map((p) => (
                  <td key={p} className="px-3 py-2 text-right tabular-nums">{f[p]}</td>
                ))}
                <td className="px-4 py-2 text-right tabular-nums text-text">{pct(f.pedidos, f.sesiones)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </GlassCard>
  );
}
