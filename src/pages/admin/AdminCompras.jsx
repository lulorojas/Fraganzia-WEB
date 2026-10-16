import { useMemo, useState } from 'react';
import { Plus, Pencil, Ban } from 'lucide-react';
import { useSocioActual } from '../../hooks/useSocioActual';
import { useCompras, useAnularCompra } from '../../hooks/useCompras';
import { useGastos, useAnularGasto } from '../../hooks/useGastos';
import { pagosDeCompra, totalDeCompra } from '../../services/panelFinancieroCalculos';
import { formatFecha, diaMes, fechaDeMovimiento, milisDeFecha } from '../../utils/format';
import { SOCIOS } from '../../constants';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, CardTitle, Kpi, Seg, Tag, Avatar, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos, pl } from '../../components/admin/ui/formato';

const nombreSocio = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id;
const dia = (m) => diaMes(fechaDeMovimiento(m));
const hace30 = () => Date.now() - 30 * 24 * 3600 * 1000;

export default function AdminCompras() {
  const { abrir, avisar } = useAdminActions();
  const socioActualId = useSocioActual();
  const { data: compras, isLoading } = useCompras();
  const { data: gastos } = useGastos();
  const anularCompra = useAnularCompra();
  const anularGasto = useAnularGasto();
  const [tab, setTab] = useState('compras');

  const totalCompras30 = useMemo(
    () => (compras ?? []).filter((c) => milisDeFecha(fechaDeMovimiento(c)) >= hace30()).reduce((a, c) => a + totalDeCompra(c), 0),
    [compras]
  );
  const gastos30 = useMemo(() => (gastos ?? []).filter((g) => milisDeFecha(fechaDeMovimiento(g)) >= hace30()), [gastos]);
  const totalGastos30 = gastos30.reduce((a, g) => a + (g.monto ?? 0), 0);

  const porCategoria = useMemo(() => {
    const m = {};
    gastos30.forEach((g) => { m[g.categoria] = (m[g.categoria] ?? 0) + (g.monto ?? 0); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [gastos30]);
  const maxCat = Math.max(1, ...porCategoria.map(([, v]) => v));

  async function anularC(c) {
    if (!window.confirm(`¿Anular la compra a "${c.proveedor}"? El stock que generó se resta.`)) return;
    await anularCompra.mutateAsync({ id: c.id, valorAnterior: c, socioId: socioActualId });
    avisar('Compra anulada');
  }

  async function anularG(g) {
    if (!window.confirm(`¿Anular el gasto "${g.descripcion}"?`)) return;
    await anularGasto.mutateAsync({ id: g.id, valorAnterior: g, socioId: socioActualId });
    avisar('Gasto anulado');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="grid-auto">
        <Kpi i={0} label="Compras · últimos 30 días" value={pesos(totalCompras30)} />
        <Kpi i={1} label="Gastos operativos · últimos 30 días" value={pesos(totalGastos30)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <Seg value={tab} onChange={setTab} options={[{ value: 'compras', label: 'Compras', count: compras?.length ?? 0 }, { value: 'gastos', label: 'Gastos', count: gastos?.length ?? 0 }]} />
        <button className="btn btn-primary" onClick={() => abrir(tab === 'compras' ? 'compra' : 'gasto')}>
          <Plus />{tab === 'compras' ? 'Nueva compra' : 'Nuevo gasto'}
        </button>
      </div>

      {tab === 'compras' ? (
        <>
          {!compras?.length && <Card i={2}><Empty>No hay compras cargadas.</Empty></Card>}
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {(compras ?? []).map((c, i) => {
              const total = totalDeCompra(c);
              const pagos = pagosDeCompra(c);
              const unidades = (c.items ?? []).reduce((a, it) => a + (it.cantidad ?? 0), 0);
              return (
                <Card key={c.id} i={i} style={{ gap: 12 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <div className="ell" style={{ fontFamily: 'Outfit', fontSize: 17 }}>{c.proveedor}</div>
                      <div className="card-note">{dia(c)} · {pl(unidades, 'perfume', 'perfumes')}</div>
                    </div>
                    <div className="text-right">
                      <div className="card-note">Precio total</div>
                      <div className="num" style={{ fontSize: 22, fontWeight: 300 }}>{pesos(total)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-[6px]">
                    {(c.items ?? []).map((it, idx) => <Tag key={idx} tone="neutral">{it.perfumeNombre} ×{it.cantidad}</Tag>)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', height: 6, gap: 3 }}>
                      {pagos.map((p, idx) => (
                        <span key={idx} className="grow-x" style={{ flex: Math.max(p.monto ?? 0, 1), borderRadius: 3, background: p.socioId === 'luciano' ? 'linear-gradient(90deg,#7B2FBE,#C084FC)' : 'linear-gradient(90deg,#a21caf,#F0ABFC)' }} />
                      ))}
                    </div>
                    <div className="card-note flex flex-wrap gap-x-3" style={{ marginTop: 6 }}>
                      {pagos.map((p, idx) => <span key={idx}>{nombreSocio(p.socioId)} puso {pesos(p.monto)}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => abrir('compra', { editando: c })}><Pencil />Editar</button>
                    <button className="btn btn-ghost btn-sm btn-bad" onClick={() => anularC(c)}><Ban />Anular</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="adm-row" style={{ alignItems: 'flex-start' }}>
          <Card i={2} style={{ flex: '1 1 280px' }}>
            <CardTitle>Por categoría · 30 días</CardTitle>
            {porCategoria.length === 0 && <Empty>Sin gastos en los últimos 30 días.</Empty>}
            {porCategoria.map(([cat, monto], idx) => (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex justify-between"><span>{cat}</span><span className="num dim">{pesos(monto)}</span></div>
                <div className="bar"><span className="grow-x" style={{ '--i': idx, width: `${(monto / maxCat) * 100}%` }} /></div>
              </div>
            ))}
          </Card>
          <Card i={3} style={{ flex: '2 1 380px', gap: 0 }}>
            <CardTitle>Todos los gastos</CardTitle>
            {!gastos?.length && <Empty>No hay gastos cargados.</Empty>}
            <div className="flex flex-col" style={{ marginTop: 8 }}>
              {(gastos ?? []).map((g) => (
                <div key={g.id} className="list-row">
                  <span className="dim num" style={{ width: 44 }}>{dia(g)}</span>
                  <Tag tone="neutral">{g.categoria}</Tag>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ell">{g.descripcion}</div>
                    <div className="card-note">Pagó {nombreSocio(g.pagadoPor)} · {g.metodoPago === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}</div>
                  </div>
                  <Avatar nombre={nombreSocio(g.pagadoPor)} socioId={g.pagadoPor} />
                  <span className="num" style={{ fontWeight: 500, minWidth: 80, textAlign: 'right' }}>{pesos(g.monto)}</span>
                  <button className="btn btn-ghost btn-icon" title="Editar" aria-label="Editar gasto" onClick={() => abrir('gasto', { editando: g })}><Pencil /></button>
                  <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular gasto" onClick={() => anularG(g)}><Ban /></button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
