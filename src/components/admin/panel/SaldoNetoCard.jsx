import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

export function SaldoNetoCard({ saldoNeto, socios }) {
  const nombre = (id) => socios?.find((s) => s.id === id)?.nombre ?? id;
  const equilibrado = Math.abs(saldoNeto ?? 0) < 1;
  const deudor = saldoNeto > 0 ? 'benja' : 'luciano';
  const acreedor = saldoNeto > 0 ? 'luciano' : 'benja';

  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-lg text-text">Saldo entre socios</h3>
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
