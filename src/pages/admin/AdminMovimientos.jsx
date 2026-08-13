import { useAuth } from '../../context/AuthContext';
import { useSocios } from '../../hooks/useSocios';
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

function useSocioActualId() {
  const { user } = useAuth();
  const { data: socios } = useSocios();
  return socios?.find((s) => s.authUid === user?.uid)?.id ?? socios?.[0]?.id ?? 'luciano';
}

export default function AdminMovimientos() {
  const { data: socios } = useSocios();
  const socioActualId = useSocioActualId();
  const nombreSocio = (id) => socios?.find((s) => s.id === id)?.nombre ?? id;

  const { data: movimientos, isLoading: cargandoMovimientos } = useMovimientosPersonales();
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
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Movimientos personales y transferencias</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard>
          <MovimientoPersonalForm onSubmit={handleCrearMovimiento} cargando={crearMovimiento.isPending} />
          <hr className="my-4 border-border" />
          {cargandoMovimientos ? <Spinner /> : !movimientos?.length ? (
            <p className="text-text-secondary">No hay movimientos personales cargados.</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {movimientos.map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b border-border py-1">
                  <span className="text-text-secondary">
                    {nombreSocio(m.socioId)} · {m.tipo === 'aporte' ? 'Aporte' : 'Retiro'} · {formatARS(m.monto)}
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
    </div>
  );
}
