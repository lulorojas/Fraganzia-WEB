import { useMemo, useState } from 'react';
import { Plus, Pencil, Ban, Check } from 'lucide-react';
import { useSocioActual } from '../../hooks/useSocioActual';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useVentasSocios, useEditarVenta, useAnularVenta } from '../../hooks/useVentasSocios';
import { useVentasDecants, useAnularVentaDecant } from '../../hooks/useVentasDecants';
import { itemsDeVenta, totalDeVenta, unidadesDeVenta } from '../../services/panelFinancieroCalculos';
import { normalizarTamano } from '../../services/analyticsCalculos';
import { formatFecha, diaMes, fechaDeMovimiento } from '../../utils/format';
import { SOCIOS } from '../../constants';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, Kpi, Seg, Tag, Thumb, Avatar, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos, pl } from '../../components/admin/ui/formato';

const COLS = '70px minmax(240px,2fr) 70px 120px 110px 100px 150px';
const nombreSocio = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id;
const nombreMetodo = (m) => (m === 'efectivo' ? 'Efectivo' : 'Mercado Pago');
const dia = (v) => diaMes(fechaDeMovimiento(v));

export default function AdminVentasSocios() {
  const { abrir, avisar } = useAdminActions();
  const socioActualId = useSocioActual();
  const { data: perfumes } = usePerfumesAdmin();
  const { data: ventas, isLoading } = useVentasSocios();
  const { data: decants } = useVentasDecants();
  const editar = useEditarVenta();
  const anular = useAnularVenta();
  const anularDecant = useAnularVentaDecant();
  const [tab, setTab] = useState('perfumes');

  const perfumePorId = useMemo(() => new Map((perfumes ?? []).map((p) => [p.id, p])), [perfumes]);
  const lista = ventas ?? [];
  const cobradas = lista.filter((v) => v.estado === 'cobrada');
  const pendientes = lista.filter((v) => v.estado === 'pendiente');
  const unidadesVendidas = cobradas.reduce((a, v) => a + unidadesDeVenta(v), 0);
  const montoPendiente = pendientes.reduce((a, v) => a + totalDeVenta(v), 0);
  const unidadesDecants = (decants ?? []).reduce((a, d) => a + (d.cantidad ?? 0), 0);

  async function marcarCobrada(v) {
    await editar.mutateAsync({
      id: v.id,
      datosNuevos: { items: itemsDeVenta(v), vendidoPor: v.vendidoPor, metodoPago: v.metodoPago, estado: 'cobrada', fecha: v.fecha },
      valorAnterior: v,
      socioId: socioActualId,
    });
    avisar('Venta cobrada: el stock se descontó');
  }

  async function anularVenta(v) {
    if (!window.confirm('¿Anular esta venta? Si estaba cobrada, el stock vuelve.')) return;
    await anular.mutateAsync({ id: v.id, valorAnterior: v, socioId: socioActualId });
    avisar('Venta anulada');
  }

  async function anularDecantVenta(d) {
    if (!window.confirm(`¿Anular el decant de "${d.perfumeNombre}"?`)) return;
    await anularDecant.mutateAsync({ id: d.id, valorAnterior: d, socioId: socioActualId });
    avisar('Decant anulado');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="grid-auto">
        <Kpi i={0} label="Perfumes vendidos" value={unidadesVendidas} />
        <Kpi i={1} tone="warn" label={`Pendiente de cobro · ${pendientes.length}`} value={pesos(montoPendiente)} />
        <Kpi i={2} label="Decants vendidos" value={unidadesDecants} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <Seg value={tab} onChange={setTab} options={[{ value: 'perfumes', label: 'Perfumes' }, { value: 'decants', label: 'Decants' }]} />
        <button className="btn btn-primary" onClick={() => abrir(tab === 'perfumes' ? 'venta' : 'decant')}>
          <Plus />{tab === 'perfumes' ? 'Cargar venta' : 'Cargar decant'}
        </button>
      </div>

      {tab === 'perfumes' ? (
        <Card i={3} className="flush" style={{ gap: 0 }}>
          <div className="tbl-scroll">
            <div className="tbl" style={{ '--cols': COLS, '--min': '860px' }}>
              <div className="tr head"><span>Fecha</span><span>Perfumes de la venta</span><span>Vendió</span><span>Cobro</span><span className="right">Total</span><span>Estado</span><span /></div>
              {lista.map((v) => (
                <div key={v.id} className="tr">
                  <span className="dim">{dia(v)}</span>
                  <div className="flex flex-col gap-[6px]">
                    {itemsDeVenta(v).map((i, idx) => (
                      <div key={idx} className="flex min-w-0 items-center gap-2">
                        <Thumb perfume={perfumePorId.get(i.perfumeId)} size={28} />
                        <span className="ell">{i.perfumeNombre}</span>
                        <span className="faint num">×{i.cantidad}</span>
                      </div>
                    ))}
                  </div>
                  <span title={nombreSocio(v.vendidoPor)}><Avatar nombre={nombreSocio(v.vendidoPor)} socioId={v.vendidoPor} /></span>
                  <span className="dim">{nombreMetodo(v.metodoPago)}</span>
                  <span className="num right" style={{ fontWeight: 500 }}>{pesos(totalDeVenta(v))}</span>
                  <span><Tag tone={v.estado === 'cobrada' ? 'ok' : 'warn'}>{v.estado === 'cobrada' ? 'Cobrada' : 'Pendiente'}</Tag></span>
                  <div className="flex justify-end gap-1">
                    {v.estado === 'pendiente' && (
                      <button className="btn btn-ok btn-sm" onClick={() => marcarCobrada(v)} title="Marcar cobrada"><Check />Cobrada</button>
                    )}
                    <button className="btn btn-ghost btn-icon" title="Editar" aria-label="Editar venta" onClick={() => abrir('venta', { editando: v })}><Pencil /></button>
                    <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular venta" onClick={() => anularVenta(v)}><Ban /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {lista.length === 0 && <Empty>Todavía no hay ventas cargadas.</Empty>}
        </Card>
      ) : (
        <>
          {!decants?.length && <Card i={3}><Empty>Todavía no hay decants vendidos.</Empty></Card>}
          <div className="grid-cards">
            {(decants ?? []).map((d, i) => (
              <Card key={d.id} i={i} style={{ gap: 12 }}>
                <div className="flex items-center gap-2">
                  <Thumb perfume={perfumePorId.get(d.perfumeId)} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ell" style={{ fontWeight: 500 }}>{d.perfumeNombre}</div>
                    <div className="card-note">{dia(d)} · {nombreMetodo(d.metodoPago)}</div>
                  </div>
                  <span className="tag tag-accent" style={{ background: 'rgba(240,171,252,.14)', color: '#F0ABFC', boxShadow: 'inset 0 0 0 1px rgba(240,171,252,.35)' }}>{normalizarTamano(d.tamano)}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="num" style={{ fontSize: 24, fontWeight: 300 }}>{pesos((d.cantidad ?? 0) * (d.precioUnitario ?? 0))}</div>
                    <div className="card-note">{pl(d.cantidad ?? 0, 'decant', 'decants')} × {pesos(d.precioUnitario)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span title={`Vendió ${nombreSocio(d.vendidoPor)}`}><Avatar nombre={nombreSocio(d.vendidoPor)} socioId={d.vendidoPor} /></span>
                    <button className="btn btn-ghost btn-icon" title="Editar" aria-label="Editar decant" onClick={() => abrir('decant', { editando: d })}><Pencil /></button>
                    <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular decant" onClick={() => anularDecantVenta(d)}><Ban /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
