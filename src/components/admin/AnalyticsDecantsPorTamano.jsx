import { useMemo, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { calcularTamanosDecantPorPerfume } from '../../services/panelFinancieroCalculos';

const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-text';

export function AnalyticsDecantsPorTamano({ ventasDecants, perfumes }) {
  const perfumesConDecants = useMemo(() => {
    const ids = new Set((ventasDecants || []).map((v) => v.perfumeId));
    return (perfumes || []).filter((p) => ids.has(p.id));
  }, [ventasDecants, perfumes]);

  const [perfumeId, setPerfumeId] = useState('');
  const tamanos = useMemo(
    () => (perfumeId ? calcularTamanosDecantPorPerfume(ventasDecants, perfumeId) : []),
    [ventasDecants, perfumeId]
  );

  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Tamaños de decant más vendidos</h3>
      <select className={SELECT} value={perfumeId} onChange={(e) => setPerfumeId(e.target.value)}>
        <option value="">Elegí un perfume…</option>
        {perfumesConDecants.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      {perfumeId && (
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {tamanos.length === 0 ? (
            <p className="text-text-secondary">Sin ventas de decant para este perfume.</p>
          ) : tamanos.map((t) => (
            <li key={t.tamano} className="flex justify-between border-b border-border py-1">
              <span className="text-text">{t.tamano}</span>
              <span className="text-text-secondary">{t.cantidad} unidades</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
