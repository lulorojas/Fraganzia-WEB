import { GlassCard } from '../ui/GlassCard';

export function AnalyticsRankingPerfumes({ ranking }) {
  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Perfumes más vendidos</h3>
      {!ranking?.length ? (
        <p className="text-text-secondary">Todavía no hay ventas cargadas.</p>
      ) : (
        <ol className="flex flex-col gap-2 text-sm">
          {ranking.map((r, i) => (
            <li key={r.perfumeId} className="flex justify-between border-b border-border py-1">
              <span className="text-text">{i + 1}. {r.perfumeNombre}</span>
              <span className="text-text-secondary">{r.cantidad} unidades</span>
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}
