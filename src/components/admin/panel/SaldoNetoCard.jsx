import { Scale } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

export function SaldoNetoCard({ saldoNeto, socios }) {
  const nombre = (id) => socios?.find((s) => s.id === id)?.nombre ?? id;
  const equilibrado = Math.abs(saldoNeto ?? 0) < 1;
  const deudor = saldoNeto > 0 ? 'benja' : 'luciano';
  const acreedor = saldoNeto > 0 ? 'luciano' : 'benja';

  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Scale className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Saldo entre socios</h3>
      </div>
      {equilibrado ? (
        <p className="font-display text-xl text-success">Equilibrado</p>
      ) : (
        <p className="font-display text-xl text-text">
          {nombre(deudor)} le debe a {nombre(acreedor)}: {formatARS(Math.abs(saldoNeto))}
        </p>
      )}
    </GlassCard>
  );
}
