import { Wallet } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

// Solo el total del socio logueado — el del otro socio depende de sus
// movimientos personales, que son privados y no se pueden leer (ver
// firestore.rules y useMovimientosPersonales).
export function TotalesSocioCard({ socioActualId, socios, totalesPorSocio }) {
  const nombre = socios?.find((s) => s.id === socioActualId)?.nombre ?? 'Yo';
  const t = totalesPorSocio?.[socioActualId] ?? { efectivo: 0, mercadopago: 0, total: 0 };

  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Wallet className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">Mi saldo ({nombre})</h3>
      </div>
      <p className="font-display text-2xl text-text">{formatARS(t.total)}</p>
      <p className="text-xs text-text-secondary">
        Efectivo {formatARS(t.efectivo)} · MP {formatARS(t.mercadopago)}
      </p>
    </GlassCard>
  );
}
