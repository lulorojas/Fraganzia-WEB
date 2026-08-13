import { Users } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export function AnalyticsActividadSocio({ actividad, socios }) {
  return (
    <GlassCard>
      <div className="mb-1 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Users className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Vendido por socio</h3>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Informativo: unidades vendidas por cada socio, sin que implique una
        comparación de desempeño.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {socios?.map((s) => {
          const a = actividad?.[s.id] ?? { perfumes: 0, decants: 0, total: 0 };
          return (
            <div key={s.id} className="rounded-xl border border-border p-3 text-center">
              <p className="text-text-secondary">{s.nombre}</p>
              <p className="font-display text-xl text-text">{a.total}</p>
              <p className="text-xs text-text-secondary">
                {a.perfumes} perfumes · {a.decants} decants
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
