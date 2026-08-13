import { GlassCard } from '../ui/GlassCard';
import { formatARS } from '../../utils/format';

export function AnalyticsEvolucionVentas({ evolucion, ingresoTotal }) {
  const maxIngreso = Math.max(1, ...(evolucion || []).map((m) => m.ingreso));

  return (
    <GlassCard>
      <h3 className="mb-1 font-display text-lg text-text">Evolución de ventas</h3>
      <p className="mb-3 text-sm text-text-secondary">Ingreso total acumulado: {formatARS(ingresoTotal ?? 0)}</p>
      {!evolucion?.length ? (
        <p className="text-text-secondary">Todavía no hay ventas cargadas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {evolucion.map((m) => (
            <div key={m.mes} className="flex items-center gap-3 text-sm">
              <span className="w-16 text-text-secondary">{m.mes}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full gradient-violet"
                  style={{ width: `${(m.ingreso / maxIngreso) * 100}%` }}
                />
              </div>
              <span className="w-28 text-right text-text">{formatARS(m.ingreso)}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
