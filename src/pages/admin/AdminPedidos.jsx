import { useMemo, useState } from 'react';
import { Search, Check, ChevronRight, X, Mail, Trash2, Ban } from 'lucide-react';
import { usePedidosList, useActualizarEstadoPedido, useEliminarPedido } from '../../hooks/usePedidos';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useAdminActions } from '../../context/AdminActionsContext';
import { milisDeFecha } from '../../utils/format';
import { Card, Kpi, Seg, Tag, Thumb, Cargando, Empty } from '../../components/admin/ui/kit';
import { iniciales, pesos, pl } from '../../components/admin/ui/formato';

const ESTADOS = {
  en_proceso: { label: 'En proceso', tone: 'warn' },
  confirmado: { label: 'Confirmado', tone: 'ok' },
  cancelado: { label: 'Cancelado', tone: 'bad' },
};

const COLS = 'minmax(190px,1.4fr) minmax(150px,1fr) 110px 110px 110px 84px';

function fechaCorta(ts) {
  const ms = milisDeFecha(ts);
  if (!ms) return '—';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const unidades = (p) => (p.items ?? []).reduce((a, i) => a + (i.cantidad ?? 0), 0);
const fechaDe = (p) => p.creadoEn ?? p.createdAt;

export default function AdminPedidos() {
  const { avisar } = useAdminActions();
  const { data: pedidos, isLoading } = usePedidosList();
  const { data: perfumes } = usePerfumesAdmin();
  const { mutateAsync: actualizarEstado } = useActualizarEstadoPedido();
  const { mutateAsync: eliminar } = useEliminarPedido();
  const [filtro, setFiltro] = useState('todos');
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(null);

  const lista = useMemo(() => pedidos ?? [], [pedidos]);
  const perfumePorId = useMemo(() => new Map((perfumes ?? []).map((p) => [p.id, p])), [perfumes]);
  const cuenta = (e) => lista.filter((p) => p.estado === e).length;

  const hoy = new Date();
  const facturado = lista
    .filter((p) => p.estado === 'confirmado')
    .filter((p) => { const d = new Date(milisDeFecha(fechaDe(p))); return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear(); })
    .reduce((a, p) => a + (p.totalARS ?? 0), 0);
  const mesNombre = hoy.toLocaleDateString('es-AR', { month: 'long' });

  const filtrados = lista
    .filter((p) => filtro === 'todos' || p.estado === filtro)
    .filter((p) => !q.trim() || p.clienteNombre?.toLowerCase().includes(q.trim().toLowerCase()));

  const pedido = abierto ? lista.find((p) => p.id === abierto) : null;

  async function cambiar(p, estado, mensaje) {
    await actualizarEstado({ id: p.id, estado });
    avisar(mensaje);
  }

  async function borrar(p) {
    if (!window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
    setAbierto(null);
    await eliminar(p.id);
    avisar('Pedido eliminado');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="grid-auto">
        <Kpi i={0} tone="warn" label="En proceso" value={cuenta('en_proceso')} />
        <Kpi i={1} label="Confirmados" value={cuenta('confirmado')} />
        <Kpi i={2} label={`Facturado en ${mesNombre}`} value={pesos(facturado)} />
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <Seg value={filtro} onChange={setFiltro} options={[
          { value: 'todos', label: 'Todos', count: lista.length },
          { value: 'en_proceso', label: 'En proceso', count: cuenta('en_proceso') },
          { value: 'confirmado', label: 'Confirmados', count: cuenta('confirmado') },
          { value: 'cancelado', label: 'Cancelados', count: cuenta('cancelado') },
        ]} />
        <div className="input-wrap" style={{ flex: '1 1 220px', maxWidth: 340 }}>
          <Search />
          <input className="input" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card i={2} className="flush" style={{ gap: 0 }}>
        <div className="tbl-scroll">
          <div className="tbl" style={{ '--cols': COLS, '--min': '760px' }}>
            <div className="tr head"><span>Cliente</span><span>Perfumes</span><span>Pago</span><span className="right">Total</span><span>Estado</span><span /></div>
            {filtrados.map((p) => {
              const est = ESTADOS[p.estado] ?? { label: p.estado ?? '—', tone: 'neutral' };
              return (
                <div key={p.id} className="tr click" onClick={() => setAbierto(p.id)}>
                  <div className="flex min-w-0 items-center gap-[10px]">
                    <span className="cell-av">{iniciales(p.clienteNombre)}</span>
                    <div className="min-w-0"><div className="ell" style={{ fontWeight: 500 }}>{p.clienteNombre}</div><div className="faint" style={{ fontSize: 12 }}>{fechaCorta(fechaDe(p))}</div></div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="thumbs">{(p.items ?? []).slice(0, 3).map((i) => <Thumb key={i.perfumeId ?? i.nombre} perfume={perfumePorId.get(i.perfumeId)} size={30} />)}</span>
                    <span className="dim" style={{ fontSize: 12.5 }}>{pl(unidades(p), 'perfume', 'perfumes')}</span>
                  </div>
                  <span className="dim">{p.metodoPago}</span>
                  <span className="num right" style={{ fontWeight: 500 }}>{pesos(p.totalARS)}</span>
                  <span><Tag tone={est.tone}>{est.label}</Tag></span>
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {p.estado === 'en_proceso' && (
                      <button className="btn btn-ok btn-icon" title="Confirmar" aria-label="Confirmar pedido" onClick={() => cambiar(p, 'confirmado', 'Pedido confirmado')}><Check /></button>
                    )}
                    <button className="btn btn-ghost btn-icon" title="Ver detalle" aria-label="Ver detalle" onClick={() => setAbierto(p.id)}><ChevronRight /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {filtrados.length === 0 && <Empty>{lista.length ? 'Ningún pedido coincide con el filtro.' : 'No hay pedidos todavía.'}</Empty>}
      </Card>

      {pedido && (
        <div className="adm-overlay right" onMouseDown={(e) => { if (e.target === e.currentTarget) setAbierto(null); }}>
          <aside className="adm-drawer" role="dialog" aria-label="Detalle del pedido">
            <div className="adm-modal-head">
              <span className="cell-av" style={{ width: 40, height: 40 }}>{iniciales(pedido.clienteNombre)}</span>
              <div style={{ flex: 1, minWidth: 0 }}><h2 className="ell">{pedido.clienteNombre}</h2><p>{fechaCorta(fechaDe(pedido))} · {pedido.metodoPago}</p></div>
              <button className="btn btn-ghost btn-icon" onClick={() => setAbierto(null)} aria-label="Cerrar"><X /></button>
            </div>
            <div className="adm-modal-body" style={{ flex: 1 }}>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone={(ESTADOS[pedido.estado] ?? {}).tone ?? 'neutral'}>{(ESTADOS[pedido.estado] ?? {}).label ?? pedido.estado}</Tag>
                {pedido.clienteEmail && (
                  <a className="btn btn-secondary btn-sm" href={`mailto:${pedido.clienteEmail}`}><Mail />{pedido.clienteEmail}</a>
                )}
              </div>

              <div className="flex flex-col">
                {(pedido.items ?? []).map((i, idx) => (
                  <div key={idx} className="list-row">
                    <Thumb perfume={perfumePorId.get(i.perfumeId)} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ell" style={{ fontWeight: 500 }}>{i.nombre}</div>
                      <div className="card-note">{i.marca} · {i.cantidad} × {pesos(i.precioARS)}</div>
                    </div>
                    <span className="num" style={{ fontWeight: 500 }}>{pesos((i.precioARS ?? 0) * (i.cantidad ?? 0))}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                {pedido.descuentoARS > 0 && <div className="notice info">Descuento efectivo 5% aplicado · −{pesos(pedido.descuentoARS)}</div>}
                <div className="total-bar"><span className="dim">Total</span><span className="num" style={{ fontSize: 26, fontWeight: 300 }}>{pesos(pedido.totalARS)}</span></div>
              </div>

              <div className="adm-modal-foot">
                {pedido.estado === 'en_proceso' && <button className="btn btn-primary" onClick={() => cambiar(pedido, 'confirmado', 'Pedido confirmado')}><Check />Confirmar</button>}
                {pedido.estado !== 'cancelado' && <button className="btn btn-secondary" onClick={() => cambiar(pedido, 'cancelado', 'Pedido cancelado')}><Ban />Cancelar</button>}
                <button className="btn btn-ghost btn-bad" onClick={() => borrar(pedido)}><Trash2 />Eliminar</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
