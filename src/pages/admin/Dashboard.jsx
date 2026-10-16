import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Scale, Package, ShoppingBag, BarChart3, ArrowLeftRight, Check, ChevronRight, ArrowRight } from 'lucide-react';
import { usePanelFinanciero } from '../../hooks/usePanelFinanciero';
import { useSocioActual } from '../../hooks/useSocioActual';
import { usePedidosList, useActualizarEstadoPedido } from '../../hooks/usePedidos';
import { useVentasSocios } from '../../hooks/useVentasSocios';
import { useVentasDecants } from '../../hooks/useVentasDecants';
import { useCompras } from '../../hooks/useCompras';
import { useGastos } from '../../hooks/useGastos';
import { useAjustesStock } from '../../hooks/useAjustesStock';
import { useTransferenciasSocios } from '../../hooks/useTransferenciasSocios';
import { useAdminActions } from '../../context/AdminActionsContext';
import {
  calcularVentasPorDia, calcularResumenMensual, calcularPendientesDeCobro, claveDeMes, mesesRecientes,
  nombreDeDia, nombreDeMes, variacionPct,
} from '../../services/analyticsCalculos';
import { SOCIOS } from '../../constants';
import { formatFecha, diaMes, fechaDeMovimiento } from '../../utils/format';
import { Card, HeroCard, CardTitle, Count, Tag, Cargando } from '../../components/admin/ui/kit';
import { corto, pesos, pl } from '../../components/admin/ui/formato';

const VACIO = [];
const nombreSocio = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id;

/** Paso "redondo" para las líneas del eje: 3 divisiones que alcancen para el máximo. */
function pasoEje(max) {
  if (max <= 0) return 100000;
  const bruto = max / 3;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const base = [1, 2, 2.5, 5, 10].find((m) => m * potencia >= bruto) ?? 10;
  return base * potencia;
}

function nombreMetodo(m) {
  return m === 'Efectivo' ? 'Efectivo' : m;
}

export default function Dashboard() {
  const { abrir, avisar } = useAdminActions();
  const socioActualId = useSocioActual();
  const { data: panel, isLoading } = usePanelFinanciero();
  const { data: pedidos } = usePedidosList();
  const { data: ventasSocios } = useVentasSocios();
  const { data: ventasDecants } = useVentasDecants();
  const { data: compras } = useCompras();
  const { data: gastos } = useGastos();
  const { data: ajustes } = useAjustesStock();
  const { data: transferencias } = useTransferenciasSocios();
  const { mutateAsync: actualizarEstado, isPending: actualizando } = useActualizarEstadoPedido();

  const hoy = useMemo(() => new Date(), []);
  const claveActual = claveDeMes(hoy);
  const [diaElegido, setDiaElegido] = useState(null);
  const diaSel = diaElegido ?? hoy.getDate();

  const dias = useMemo(
    () => calcularVentasPorDia({ ventasSocios: ventasSocios ?? VACIO, ventasDecants: ventasDecants ?? VACIO }, claveActual, hoy.getDate()),
    [ventasSocios, ventasDecants, claveActual, hoy]
  );

  const mes = useMemo(() => {
    const meses = mesesRecientes(2, hoy);
    const [anterior, actual] = calcularResumenMensual({
      ventasSocios: ventasSocios ?? VACIO, ventasDecants: ventasDecants ?? VACIO, compras: compras ?? VACIO,
      gastos: gastos ?? VACIO, ajustesStock: ajustes ?? VACIO,
    }, meses);
    return { anterior, actual };
  }, [ventasSocios, ventasDecants, compras, gastos, ajustes, hoy]);

  const pendientes = useMemo(() => calcularPendientesDeCobro(ventasSocios ?? VACIO), [ventasSocios]);
  const enProceso = (pedidos ?? VACIO).filter((p) => p.estado === 'en_proceso');

  if (isLoading) return <Cargando />;

  // ─── Saldos ───
  const mio = panel?.totalesPorSocio?.[socioActualId] ?? { efectivo: 0, mercadopago: 0, total: 0 };
  const sumaMetodos = Math.max(0, mio.efectivo) + Math.max(0, mio.mercadopago);
  const pctEfectivo = sumaMetodos ? (Math.max(0, mio.efectivo) / sumaMetodos) * 100 : 50;

  const saldo = panel?.saldoNeto ?? 0;
  const aMano = Math.abs(saldo) < 0.5;
  const deudor = saldo > 0 ? 'benja' : 'luciano';
  const acreedor = saldo > 0 ? 'luciano' : 'benja';
  const ultimaTransf = (transferencias ?? VACIO)[0];

  // ─── Por cobrar ───
  const unidadesStock = Object.values(panel?.stockPorProducto ?? {}).reduce((a, n) => a + n, 0);
  const porCobrar = panel?.porCobrar?.total ?? 0;
  const otroSocio = SOCIOS.find((s) => s.id !== socioActualId);

  // ─── Gráfico ───
  const maxDia = Math.max(0, ...dias.map((d) => d.total));
  const paso = pasoEje(maxDia);
  const tope = paso * 3;
  const delta = variacionPct(mes.actual.vendido, mes.anterior.vendido);
  const sel = dias.find((d) => d.dia === diaSel) ?? dias[dias.length - 1];
  const fechaSel = new Date(hoy.getFullYear(), hoy.getMonth(), sel?.dia ?? 1);
  const mesNombre = nombreDeMes(hoy.getMonth());

  async function confirmar(p) {
    await actualizarEstado({ id: p.id, estado: 'confirmado' });
    avisar('Pedido confirmado');
  }

  return (
    <div className="adm-stack">
      <div className="adm-row">
        <Card i={0} style={{ flex: '1 1 280px' }}>
          <CardTitle Icon={Wallet}>Mi saldo</CardTitle>
          <span className="big"><Count value={mio.total} format={pesos} /></span>
          <div style={{ display: 'flex', height: 6, gap: 3 }}>
            <span className="grow-x" style={{ width: `${pctEfectivo}%`, borderRadius: 3, background: 'linear-gradient(90deg,#9B59D0,#C084FC)', boxShadow: '0 0 12px rgba(192,132,252,.6)' }} />
            <span className="grow-x" style={{ flex: 1, borderRadius: 3, background: 'linear-gradient(90deg,#5b21b6,#7B2FBE)' }} />
          </div>
          <div className="grid grid-cols-2 gap-[10px]">
            <div><span className="card-note flex items-center gap-[6px]"><span className="dot" style={{ background: '#C084FC', boxShadow: '0 0 8px #C084FC' }} />Efectivo</span><span className="num" style={{ fontSize: 17, fontWeight: 500 }}>{pesos(mio.efectivo)}</span></div>
            <div><span className="card-note flex items-center gap-[6px]"><span className="dot" style={{ background: '#7B2FBE' }} />Mercado Pago</span><span className="num" style={{ fontSize: 17, fontWeight: 500 }}>{pesos(mio.mercadopago)}</span></div>
          </div>
        </Card>

        <HeroCard i={1} style={{ flex: '1.5 1 380px' }}>
          <CardTitle Icon={Scale}>Saldo entre socios</CardTitle>
          <div className="flex flex-col gap-[6px]">
            {aMano ? (
              <span className="num" style={{ fontSize: 24, letterSpacing: '-.015em' }}>Están <span style={{ color: '#C084FC' }}>a mano</span></span>
            ) : (
              <span className="num" style={{ fontSize: 24, letterSpacing: '-.015em', lineHeight: 1.15 }}>
                {nombreSocio(deudor)} <span style={{ color: '#C084FC' }}>le debe a</span> {nombreSocio(acreedor)}
              </span>
            )}
            <span className="num" style={{ fontSize: 52, fontWeight: 300, letterSpacing: '-.035em', lineHeight: .95, textShadow: '0 0 40px rgba(192,132,252,.45)' }}>
              <Count value={Math.abs(saldo)} format={pesos} />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3" style={{ marginTop: 'auto' }}>
            <button className="btn btn-primary" onClick={() => abrir('transferencia')}><ArrowLeftRight />Registrar transferencia</button>
            {ultimaTransf && (
              <span className="card-note">
                Última: {diaMes(fechaDeMovimiento(ultimaTransf))} · {nombreSocio(ultimaTransf.de)} → {nombreSocio(ultimaTransf.a)} {pesos(ultimaTransf.monto)}
              </span>
            )}
          </div>
        </HeroCard>
      </div>

      <div className="adm-row">
        <Card i={2} style={{ flex: '1 1 300px', gap: 12 }}>
          <div className="flex flex-col gap-[2px]">
            <CardTitle Icon={Package}>Por cobrar</CardTitle>
            <span className="card-note">Si se vende todo el stock a precio de lista por transferencia</span>
          </div>
          <span className="big ok-text"><Count value={porCobrar} format={pesos} /></span>
          <span className="card-note">{pl(unidadesStock, 'unidad', 'unidades')} en stock</span>
          <div className="grid grid-cols-2 gap-2">
            {[['Tu parte · 50%', porCobrar / 2], [`${otroSocio?.nombre} · 50%`, porCobrar / 2]].map(([t, v]) => (
              <div key={t} style={{ padding: '8px 10px', borderRadius: 12, boxShadow: '0 0 0 1px rgba(147,51,234,.22)' }}>
                <span className="card-note" style={{ fontSize: 12 }}>{t}</span>
                <div className="num" style={{ fontSize: 16, fontWeight: 500 }}>{pesos(v)}</div>
              </div>
            ))}
          </div>
          <span className="line" />
          <Link to="/admin/ventas" className="flex items-center gap-[10px]" style={{ fontSize: 13, color: 'inherit', textDecoration: 'none' }}>
            <span className="dim" style={{ flex: 1 }}>Ventas cargadas pendientes de cobro · {pendientes.cantidad}</span>
            <span className="num" style={{ fontWeight: 500 }}>{pesos(pendientes.monto)}</span>
            <ChevronRight size={16} color="#C084FC" />
          </Link>
        </Card>

        <Card i={3} style={{ flex: '1 1 340px', gap: 10 }}>
          <CardTitle Icon={ShoppingBag} right={<span className="adm-badge" style={{ minWidth: 28, height: 28, fontSize: 15, fontFamily: 'Outfit' }}>{enProceso.length}</span>}>
            Pedidos para atender
          </CardTitle>
          <div className="flex flex-col">
            {enProceso.slice(0, 4).map((p) => (
              <div key={p.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ell" style={{ fontSize: 13.5, fontWeight: 500 }}>{p.clienteNombre}</div>
                  <div className="card-note" style={{ fontSize: 12 }}>
                    {pl((p.items ?? []).reduce((a, i) => a + (i.cantidad ?? 0), 0), 'perfume', 'perfumes')} · {nombreMetodo(p.metodoPago)} · {diaMes(p.creadoEn ?? p.createdAt)}
                  </div>
                </div>
                <span className="num" style={{ fontWeight: 500 }}>{pesos(p.totalARS)}</span>
                <button className="btn btn-ok btn-icon" disabled={actualizando} onClick={() => confirmar(p)} title="Confirmar" aria-label="Confirmar pedido"><Check /></button>
              </div>
            ))}
            {enProceso.length === 0 && <span className="dim" style={{ padding: '10px 0' }}>No hay pedidos en proceso.</span>}
          </div>
          <Link to="/admin/pedidos" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Ver todos los pedidos <ArrowRight /></Link>
        </Card>
      </div>

      <Card i={4} style={{ gap: 16 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-[2px]">
            <CardTitle Icon={BarChart3}>Ventas de {mesNombre}</CardTitle>
            <span className="card-note">Cada barra es un día. Tocá una para ver qué se vendió.</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="big" style={{ fontSize: 34 }}><Count value={mes.actual.vendido} format={pesos} /></span>
            {delta != null && (
              <Tag tone={delta >= 0 ? 'accent' : 'warn'}>
                {delta >= 0 ? '+' : ''}{Math.round(delta)}% vs {nombreDeMes(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).getMonth())}
              </Tag>
            )}
          </div>
        </div>

        {sel && (
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[6px]" style={{ padding: '10px 12px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(123,47,190,.32),rgba(155,89,208,.08))', border: '1px solid rgba(192,132,252,.28)' }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{nombreDeDia(fechaSel)} {sel.dia} de {mesNombre}</span>
            <span className="num" style={{ fontSize: 13.5, fontWeight: 500 }}>{pesos(sel.total)}</span>
            <span className="flex items-center gap-[6px] card-note" style={{ color: '#C8BEDF' }}><span className="dot" style={{ background: '#C084FC', boxShadow: '0 0 8px #C084FC' }} />{pl(sel.perfumes.unidades, 'perfume', 'perfumes')} · {pesos(sel.perfumes.monto)}</span>
            <span className="flex items-center gap-[6px] card-note" style={{ color: '#C8BEDF' }}><span className="dot" style={{ background: '#F0ABFC', boxShadow: '0 0 8px #F0ABFC' }} />{pl(sel.decants.unidades, 'decant', 'decants')} · {pesos(sel.decants.monto)}</span>
          </div>
        )}

        <div>
          <div className="chart">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="chart-y" style={{ bottom: `${(n / 3) * 100}%` }}><span>{corto(paso * n)}</span></div>
            ))}
            <div className="chart-cols">
              {dias.map((d, idx) => (
                <button
                  key={d.dia}
                  className={`chart-col ${d.dia === diaSel ? 'on' : ''}`}
                  onClick={() => setDiaElegido(d.dia)}
                  aria-label={`Día ${d.dia}: ${pesos(d.total)}`}
                  title={`Día ${d.dia}: ${pesos(d.total)}`}
                >
                  <span className="grow-y" style={{ '--i': idx, display: 'block', width: '100%', height: `${(d.decants.monto / tope) * 100}%`, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg,#F0ABFC,#d98ae8)' }} />
                  <span className="grow-y" style={{ '--i': idx, display: 'block', width: '100%', height: `${(d.perfumes.monto / tope) * 100}%`, borderRadius: d.decants.monto ? 0 : '3px 3px 0 0', background: 'linear-gradient(180deg,#C084FC,#7B2FBE)', boxShadow: d.dia === diaSel ? '0 0 16px rgba(192,132,252,.7)' : 'none' }} />
                </button>
              ))}
            </div>
          </div>
          <div className="chart-labels" style={{ marginTop: 6 }}>
            {dias.map((d) => <span key={d.dia} className={d.dia === diaSel ? 'on' : ''}>{d.dia}</span>)}
          </div>
        </div>

        <span className="card-note">
          {pl(mes.actual.perfumes.unidades, 'perfume', 'perfumes')} ({pesos(mes.actual.perfumes.monto)}) y {pl(mes.actual.decants.unidades, 'decant', 'decants')} ({pesos(mes.actual.decants.monto)}) del 1 al {hoy.getDate()} de {mesNombre}
        </span>
      </Card>
    </div>
  );
}
