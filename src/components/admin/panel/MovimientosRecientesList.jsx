import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

function importeDe(m) {
  if (m.cantidad != null && m.precioUnitario != null) return m.cantidad * m.precioUnitario;
  return m.monto ?? 0;
}

export function MovimientosRecientesList({ movimientos }) {
  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Movimientos recientes</h3>
      {!movimientos?.length ? (
        <p className="text-text-secondary">Todavía no hay movimientos cargados.</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          {movimientos.map((m) => (
            <div key={`${m.tipo}-${m.id}`} className="flex justify-between border-b border-border py-1">
              <span className="text-text-secondary">{m.tipo}{m.perfumeNombre ? ` · ${m.perfumeNombre}` : ''}</span>
              <span className="text-text">{formatARS(importeDe(m))}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
