import { Lock, Users, ArrowLeftRight, Plus, Ban } from 'lucide-react';
import { useSocioActual } from '../../hooks/useSocioActual';
import { useMovimientosPersonales, useAnularMovimientoPersonal } from '../../hooks/useMovimientosPersonales';
import { useTransferenciasSocios, useAnularTransferencia } from '../../hooks/useTransferenciasSocios';
import { useCambiosMetodo, useAnularCambioMetodo } from '../../hooks/useCambiosMetodo';
import { usePanelFinanciero } from '../../hooks/usePanelFinanciero';
import { useAdminActions } from '../../context/AdminActionsContext';
import { PasajeForm } from '../../components/admin/PasajeForm';
import { SOCIOS } from '../../constants';
import { formatFecha, diaMes, fechaDeMovimiento } from '../../utils/format';
import { Card, CardTitle, Tag, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos } from '../../components/admin/ui/formato';

const nombreSocio = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id;
const nombreMetodo = (m) => (m === 'efectivo' ? 'Efectivo' : 'Mercado Pago');
const dia = (m) => diaMes(fechaDeMovimiento(m));

export default function AdminMovimientos() {
  const { abrir, avisar } = useAdminActions();
  const socioActualId = useSocioActual();
  const { data: panel } = usePanelFinanciero();

  // Privado: solo trae lo del socio logueado (regla de Firestore).
  const { data: movimientos, isLoading } = useMovimientosPersonales(socioActualId);
  const { data: transferencias } = useTransferenciasSocios();
  const { data: cambios } = useCambiosMetodo(socioActualId);
  const anularMovimiento = useAnularMovimientoPersonal();
  const anularTransferencia = useAnularTransferencia();
  const anularCambio = useAnularCambioMetodo();

  const saldo = panel?.saldoNeto ?? 0;
  const aMano = Math.abs(saldo) < 0.5;

  async function anular(mutacion, item, pregunta, aviso) {
    if (!window.confirm(pregunta)) return;
    await mutacion.mutateAsync({ id: item.id, valorAnterior: item, socioId: socioActualId });
    avisar(aviso);
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="adm-row" style={{ alignItems: 'flex-start' }}>
        <Card i={0} style={{ flex: '1 1 340px' }}>
          <CardTitle Icon={Lock} right={<Tag tone="accent"><Lock />Privado</Tag>}>Mis movimientos</CardTitle>
          <span className="card-note">Retiros y aportes tuyos. El otro socio no los ve.</span>
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => abrir('movimiento')}><Plus />Retiro o aporte</button>
          </div>
          {!movimientos?.length ? <Empty>Todavía no cargaste movimientos personales.</Empty> : (
            <div className="flex flex-col">
              {movimientos.map((m) => (
                <div key={m.id} className="list-row">
                  <Tag tone={m.tipo === 'aporte' ? 'ok' : 'warn'}>{m.tipo === 'aporte' ? 'Aporte' : 'Retiro'}</Tag>
                  <div style={{ flex: 1 }}><div className="num" style={{ fontWeight: 500 }}>{pesos(m.monto)}</div><div className="card-note">{dia(m)} · {nombreMetodo(m.metodo)}</div></div>
                  <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular movimiento" onClick={() => anular(anularMovimiento, m, '¿Anular este movimiento personal?', 'Movimiento anulado')}><Ban /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card i={1} style={{ flex: '1 1 340px' }}>
          <CardTitle Icon={Users} right={<Tag tone="neutral">Compartido</Tag>}>Transferencias entre socios</CardTitle>
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(123,47,190,.32),rgba(155,89,208,.08))', border: '1px solid rgba(192,132,252,.28)' }}>
            {aMano ? <span className="num" style={{ fontSize: 18 }}>Están a mano</span> : (
              <>
                <span className="num" style={{ fontSize: 15 }}>{nombreSocio(saldo > 0 ? 'benja' : 'luciano')} <span style={{ color: '#C084FC' }}>le debe a</span> {nombreSocio(saldo > 0 ? 'luciano' : 'benja')}</span>
                <div className="num" style={{ fontSize: 30, fontWeight: 300 }}>{pesos(Math.abs(saldo))}</div>
              </>
            )}
          </div>
          <div>
            <button className="btn btn-primary btn-sm" onClick={() => abrir('transferencia')}><ArrowLeftRight />Registrar transferencia</button>
          </div>
          {!transferencias?.length ? <Empty>No hay transferencias registradas.</Empty> : (
            <div className="flex flex-col">
              {transferencias.map((t) => (
                <div key={t.id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div>{nombreSocio(t.de)} → {nombreSocio(t.a)}</div>
                    <div className="card-note">{dia(t)} · {nombreMetodo(t.metodo)}</div>
                  </div>
                  <span className="num" style={{ fontWeight: 500 }}>{pesos(t.monto)}</span>
                  <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular transferencia" onClick={() => anular(anularTransferencia, t, '¿Anular esta transferencia?', 'Transferencia anulada')}><Ban /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card i={2}>
        <CardTitle Icon={ArrowLeftRight} right={<Tag tone="accent"><Lock />Privado</Tag>}>Pasaje de dinero · efectivo ⇄ Mercado Pago</CardTitle>
        <span className="card-note">Para cuando le pasás Mercado Pago a alguien y te devuelve efectivo, o al revés. La plata sigue siendo tuya: solo cambia de bolsillo.</span>
        <div className="adm-row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: '1.2 1 340px', minWidth: 0 }}><PasajeForm onGuardado={avisar} /></div>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div className="label" style={{ marginBottom: 6 }}>Últimos pasajes</div>
            {!cambios?.length ? <Empty>No hay pasajes registrados.</Empty> : (
              <div className="flex flex-col">
                {cambios.slice(0, 6).map((c) => (
                  <div key={c.id} className="list-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div>{nombreMetodo(c.de)} → {nombreMetodo(c.a)}</div>
                      <div className="card-note">
                        {dia(c)}{(c.montoRecibido ?? c.monto) !== c.monto && ` · entraron ${pesos(c.montoRecibido)}`}
                      </div>
                    </div>
                    <span className="num" style={{ fontWeight: 500 }}>{pesos(c.monto)}</span>
                    <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular pasaje" onClick={() => anular(anularCambio, c, '¿Anular este pasaje de dinero?', 'Pasaje anulado')}><Ban /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
