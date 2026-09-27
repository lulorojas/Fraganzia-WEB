import { Activity } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { formatARS, formatFecha, fechaDeMovimiento } from '../../../utils/format';

function importeDe(m) {
  if (m.cantidad != null && m.precioUnitario != null) return m.cantidad * m.precioUnitario;
  if (m.montoTotal != null) return m.montoTotal;
  return m.monto ?? 0;
}

function detalleDe(m) {
  if (m.perfumeNombre) return m.perfumeNombre;
  if (m.items?.length) return m.items.map((i) => i.perfumeNombre).join(', ');
  return null;
}

export function MovimientosRecientesList({ movimientos }) {
  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Activity className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Movimientos recientes</h3>
      </div>
      {!movimientos?.length ? (
        <p className="text-text-secondary">Todavía no hay movimientos cargados.</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          {movimientos.map((m) => (
            <div key={`${m.tipo}-${m.id}`} className="flex items-baseline justify-between gap-2 border-b border-border py-1">
              <span className="min-w-0 text-text-secondary">
                <span className="whitespace-nowrap">{formatFecha(fechaDeMovimiento(m))}</span>
                {' · '}{m.tipo}{detalleDe(m) ? ` · ${detalleDe(m)}` : ''}
              </span>
              <span className="shrink-0 text-text">{formatARS(importeDe(m))}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
