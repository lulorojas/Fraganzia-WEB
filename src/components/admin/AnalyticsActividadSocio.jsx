import { GlassCard } from '../ui/GlassCard';

export function AnalyticsActividadSocio({ actividad, socios }) {
  return (
    <GlassCard>
      <h3 className="mb-1 font-display text-lg text-text">Actividad por socio</h3>
      <p className="mb-3 text-xs text-text-secondary">
        Informativo: cantidad de movimientos cargados por cada socio, sin que implique una
        comparación de desempeño.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {socios?.map((s) => (
          <div key={s.id} className="rounded-xl border border-border p-3 text-center">
            <p className="text-text-secondary">{s.nombre}</p>
            <p className="font-display text-xl text-text">{actividad?.[s.id] ?? 0}</p>
            <p className="text-xs text-text-secondary">movimientos cargados</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
