import { useSocios } from '../../hooks/useSocios';
import { useSocioActual } from '../../hooks/useSocioActual';
import {
  useMovimientosPersonales, useCrearMovimientoPersonal, useAnularMovimientoPersonal,
} from '../../hooks/useMovimientosPersonales';
import {
  useTransferenciasSocios, useCrearTransferencia, useAnularTransferencia,
} from '../../hooks/useTransferenciasSocios';
import { MovimientoPersonalForm } from '../../components/admin/MovimientoPersonalForm';
import { TransferenciaForm } from '../../components/admin/TransferenciaForm';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';
import { formatARS } from '../../utils/format';

export default function AdminMovimientos() {
  const { data: socios } = useSocios();
  const socioActualId = useSocioActual();
  const nombreSocio = (id) => socios?.find((s) => s.id === id)?.nombre ?? id;

  // Privado: solo trae los movimientos del socio logueado (regla de Firestore).
  const { data: movimientos, isLoading: cargandoMovimientos } = useMovimientosPersonales(socioActualId);
  const crearMovimiento = useCrearMovimientoPersonal();
  const anularMovimiento = useAnularMovimientoPersonal();

  const { data: transferencias, isLoading: cargandoTransferencias } = useTransferenciasSocios();
  const crearTransferencia = useCrearTransferencia();
  const anularTransferencia = useAnularTransferencia();

  async function handleCrearMovimiento(datos) {
    await crearMovimiento.mutateAsync({ datos, socioId: socioActualId });
  }

  async function handleAnularMovimiento(m) {
    if (window.confirm('¿Anular este movimiento personal?')) {
      await anularMovimiento.mutateAsync({ id: m.id, valorAnterior: m, socioId: socioActualId });
    }
  }

  async function handleCrearTransferencia(datos) {
    await crearTransferencia.mutateAsync({ datos, socioId: socioActualId });
  }

  async function handleAnularTransferencia(t) {
    if (window.confirm('¿Anular esta transferencia?')) {
      await anularTransferencia.mutateAsync({ id: t.id, valorAnterior: t, socioId: socioActualId });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GlassCard>
        <p className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Privado — solo vos</p>
        <MovimientoPersonalForm socioActualId={socioActualId} onSubmit={handleCrearMovimiento} cargando={crearMovimiento.isPending} />
        <hr className="my-4 border-border" />
        {cargandoMovimientos ? <Spinner /> : !movimientos?.length ? (
          <p className="text-text-secondary">Todavía no cargaste movimientos personales.</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {movimientos.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-border py-1">
                <span className="text-text-secondary">
                  {m.tipo === 'aporte' ? 'Aporte' : 'Retiro'} · {formatARS(m.monto)}
                </span>
                <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => handleAnularMovimiento(m)}>
                  Anular
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <p className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Compartido — lo ven ambos socios</p>
        <TransferenciaForm onSubmit={handleCrearTransferencia} cargando={crearTransferencia.isPending} />
        <hr className="my-4 border-border" />
        {cargandoTransferencias ? <Spinner /> : !transferencias?.length ? (
          <p className="text-text-secondary">No hay transferencias registradas.</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {transferencias.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-border py-1">
                <span className="text-text-secondary">
                  {nombreSocio(t.de)} → {nombreSocio(t.a)} · {formatARS(t.monto)}
                </span>
                <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => handleAnularTransferencia(t)}>
                  Anular
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
