import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

export function TotalesSocioCard({ socios, totalesPorSocio }) {
  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Totales por socio</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {socios?.map((s) => {
          const t = totalesPorSocio?.[s.id] ?? { efectivo: 0, mercadopago: 0, total: 0 };
          return (
            <div key={s.id} className="rounded-xl border border-border p-3">
              <p className="font-body text-text-secondary">{s.nombre}</p>
              <p className="font-display text-xl text-text">{formatARS(t.total)}</p>
              <p className="text-xs text-text-secondary">
                Efectivo {formatARS(t.efectivo)} · MP {formatARS(t.mercadopago)}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
