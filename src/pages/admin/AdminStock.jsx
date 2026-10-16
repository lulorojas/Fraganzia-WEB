import { useMemo } from 'react';
import { Package, Pencil, Ban, Plus } from 'lucide-react';
import { useSocioActual } from '../../hooks/useSocioActual';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useStock } from '../../hooks/useStock';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { useAjustesStock, useAnularAjusteStock } from '../../hooks/useAjustesStock';
import { precioListaARS } from '../../utils/precios';
import { formatFecha, fechaDeMovimiento } from '../../utils/format';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, CardTitle, Count, Tag, Thumb, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos, pl } from '../../components/admin/ui/formato';

export default function AdminStock() {
  const { abrir, avisar } = useAdminActions();
  const socioActualId = useSocioActual();
  const { data: perfumes } = usePerfumesAdmin();
  const { stock } = useStock();
  const { dolarMedio } = useDolarBlue();
  const { data: ajustes, isLoading } = useAjustesStock();
  const anular = useAnularAjusteStock();

  // Solo lo que tiene stock: lo que se agotó no se lista ni se marca.
  const conStock = useMemo(() => {
    const porId = new Map((perfumes ?? []).map((p) => [p.id, p]));
    return Object.entries(stock)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([id, cantidad]) => {
        const p = porId.get(id);
        return { id, cantidad, perfume: p, nombre: p?.nombre ?? id, valor: cantidad * precioListaARS(p, dolarMedio) };
      })
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  }, [stock, perfumes, dolarMedio]);

  const unidades = conStock.reduce((a, p) => a + p.cantidad, 0);
  const valorTotal = conStock.reduce((a, p) => a + p.valor, 0);
  const maxCantidad = Math.max(1, ...conStock.map((p) => p.cantidad));

  async function handleAnular(a) {
    if (!window.confirm('¿Anular este ajuste? El stock vuelve a como estaba antes.')) return;
    await anular.mutateAsync({ id: a.id, valorAnterior: a, socioId: socioActualId });
    avisar('Ajuste anulado');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-row" style={{ alignItems: 'flex-start' }}>
      <Card i={0} style={{ flex: '1.4 1 420px' }}>
        <CardTitle Icon={Package}>Stock actual</CardTitle>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="big"><Count value={unidades} format={(n) => String(Math.round(n))} /></span>
            <span className="dim"> {unidades === 1 ? 'unidad' : 'unidades'}</span>
          </div>
          <div className="text-right"><div className="card-note">A precio de lista</div><div className="num" style={{ fontSize: 20, fontWeight: 300 }}>{pesos(valorTotal)}</div></div>
        </div>
        <div className="flex flex-col">
          {conStock.map((p, idx) => (
            <div key={p.id} className="list-row">
              <Thumb perfume={p.perfume} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="ell" style={{ fontWeight: 500 }}>{p.nombre}</span>
                  <span className="num" style={{ fontWeight: 500 }}>{p.cantidad}</span>
                </div>
                <div className="bar" style={{ marginTop: 5 }}><span className="grow-x" style={{ '--i': idx, width: `${(p.cantidad / maxCantidad) * 100}%` }} /></div>
              </div>
              <span className="card-note num" style={{ width: 84, textAlign: 'right' }}>{p.valor ? pesos(p.valor) : '—'}</span>
            </div>
          ))}
          {conStock.length === 0 && <Empty>No hay stock cargado todavía.</Empty>}
        </div>
        <span className="card-note">Compras cargadas + ajustes manuales − ventas cobradas.</span>
      </Card>

      <Card i={1} style={{ flex: '1 1 320px' }}>
        <CardTitle Icon={Pencil} right={<button className="btn btn-secondary btn-sm" onClick={() => abrir('ajuste')}><Plus />Ajustar</button>}>
          Ajustes manuales
        </CardTitle>
        {!ajustes?.length ? (
          <Empty>Todavía no hay ajustes. Sirven para cargar mercadería vieja sin compra registrada, o descontar unidades perdidas.</Empty>
        ) : (
          <div className="flex flex-col">
            {ajustes.map((a) => (
              <div key={a.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <Tag tone={a.cantidad >= 0 ? 'ok' : 'bad'}>{a.cantidad >= 0 ? '+' : '−'}{Math.abs(a.cantidad)}</Tag>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ell" style={{ fontWeight: 500 }}>{a.perfumeNombre}</div>
                  <div className="card-note">{formatFecha(fechaDeMovimiento(a))} · {a.motivo}</div>
                </div>
                <button className="btn btn-ghost btn-icon" title="Editar" aria-label="Editar ajuste" onClick={() => abrir('ajuste', { editando: a })}><Pencil /></button>
                <button className="btn btn-ghost btn-icon btn-bad" title="Anular" aria-label="Anular ajuste" onClick={() => handleAnular(a)}><Ban /></button>
              </div>
            ))}
          </div>
        )}
        <span className="card-note">{pl(ajustes?.length ?? 0, 'ajuste', 'ajustes')} vigentes.</span>
      </Card>
    </div>
  );
}
