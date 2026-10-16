import { useMemo, useState } from 'react';
import { Search, Check, ChevronRight, X, Mail, Trash2, Ban, Link2 } from 'lucide-react';
import { usePedidosList, useActualizarEstadoPedido, useEliminarPedido } from '../../hooks/usePedidos';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useAdminActions } from '../../context/AdminActionsContext';
import { ESTADOS_PEDIDO, ESTADO_PEDIDO_INFO, numeroPedido } from '../../constants';
import { SITE_URL } from '../../hooks/useDocumentMeta';
import { esNuevo, enCurso, TONO_ESTADO } from '../../utils/estadosPedido';
import { milisDeFecha } from '../../utils/format';
import { Card, Kpi, Seg, Tag, Thumb, Cargando, Empty } from '../../components/admin/ui/kit';
import { iniciales, pesos, pl } from '../../components/admin/ui/formato';

const COLS = 'minmax(190px,1.4fr) minmax(150px,1fr) 110px 110px 130px 84px';

// Los pedidos se guardan con `creadoEn`; los muy viejos pueden tener `createdAt`.
const fechaDe = (p) => p.creadoEn ?? p.createdAt;

function fechaCorta(ts) {
  const ms = milisDeFecha(ts);
  if (!ms) return '—';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const unidades = (p) => (p.items ?? []).reduce((a, i) => a + (i.cantidad ?? 0), 0);
const etiqueta = (estado) => ESTADO_PEDIDO_INFO[estado]?.label ?? estado ?? '—';

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

  const nuevos = lista.filter(esNuevo);
  const encurso = lista.filter(enCurso);
  const entregados = lista.filter((p) => p.estado === 'entregado');
  const cancelados = lista.filter((p) => p.estado === 'cancelado');

  const hoy = new Date();
  const delMes = lista
    .filter((p) => p.estado !== 'cancelado')
    .filter((p) => { const d = new Date(milisDeFecha(fechaDe(p))); return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear(); })
    .reduce((a, p) => a + (p.totalARS ?? 0), 0);
  const mesNombre = hoy.toLocaleDateString('es-AR', { month: 'long' });

  const porFiltro = { todos: lista, nuevos, encurso, entregados, cancelados };
  const filtrados = porFiltro[filtro]
    .filter((p) => !q.trim() || p.clienteNombre?.toLowerCase().includes(q.trim().toLowerCase()));

  const pedido = abierto ? lista.find((p) => p.id === abierto) : null;

  async function cambiar(p, estado, mensaje) {
    if (estado === 'cancelado' && !window.confirm('¿Cancelar este pedido? El cliente lo va a ver en su seguimiento.')) return;
    await actualizarEstado({ id: p.id, estado });
    avisar(mensaje ?? `Pedido: ${etiqueta(estado)}`);
  }

  async function borrar(p) {
    if (!window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
    setAbierto(null);
    await eliminar(p.id);
    avisar('Pedido eliminado');
  }

  async function copiarLink(p) {
    const link = `${SITE_URL}/pedido/${p.id}`;
    try {
      await navigator.clipboard.writeText(link);
      avisar('Link de seguimiento copiado');
    } catch {
      window.prompt('Link de seguimiento:', link);
    }
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="grid-auto">
        <Kpi i={0} tone="warn" label="Por atender" value={nuevos.length} />
        <Kpi i={1} label="En preparación o enviados" value={encurso.length} />
        <Kpi i={2} label={`Pedido en ${mesNombre}`} value={pesos(delMes)} />
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <Seg value={filtro} onChange={setFiltro} options={[
          { value: 'todos', label: 'Todos', count: lista.length },
          { value: 'nuevos', label: 'Por atender', count: nuevos.length },
          { value: 'encurso', label: 'En curso', count: encurso.length },
          { value: 'entregados', label: 'Entregados', count: entregados.length },
          { value: 'cancelados', label: 'Cancelados', count: cancelados.length },
        ]} />
        <div className="input-wrap" style={{ flex: '1 1 220px', maxWidth: 340 }}>
          <Search />
          <input className="input" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card i={2} className="flush" style={{ gap: 0 }}>
        <div className="tbl-scroll">
          <div className="tbl" style={{ '--cols': COLS, '--min': '780px' }}>
            <div className="tr head"><span>Cliente</span><span>Perfumes</span><span>Pago</span><span className="right">Total</span><span>Estado</span><span /></div>
            {filtrados.map((p) => (
              <div key={p.id} className="tr click" onClick={() => setAbierto(p.id)}>
                <div className="flex min-w-0 items-center gap-[10px]">
                  <span className="cell-av">{iniciales(p.clienteNombre)}</span>
                  <div className="min-w-0">
                    <div className="ell" style={{ fontWeight: 500 }}>{p.clienteNombre}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{numeroPedido(p.id)} · {fechaCorta(fechaDe(p))}</div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="thumbs">{(p.items ?? []).slice(0, 3).map((i, idx) => <Thumb key={`${i.perfumeId ?? i.nombre}-${idx}`} perfume={perfumePorId.get(i.perfumeId)} size={30} />)}</span>
                  <span className="dim" style={{ fontSize: 12.5 }}>{pl(unidades(p), 'perfume', 'perfumes')}</span>
                </div>
                <span className="dim">{p.metodoPago}</span>
                <span className="num right" style={{ fontWeight: 500 }}>{pesos(p.totalARS)}</span>
                <span><Tag tone={TONO_ESTADO[p.estado] ?? 'neutral'}>{etiqueta(p.estado)}</Tag></span>
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {esNuevo(p) && (
                    <button className="btn btn-ok btn-icon" title="Pago confirmado: pasar a preparación" aria-label="Pasar a preparación" onClick={() => cambiar(p, 'preparando')}><Check /></button>
                  )}
                  <button className="btn btn-ghost btn-icon" title="Ver detalle" aria-label="Ver detalle" onClick={() => setAbierto(p.id)}><ChevronRight /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {filtrados.length === 0 && <Empty>{lista.length ? 'Ningún pedido coincide con el filtro.' : 'No hay pedidos todavía.'}</Empty>}
      </Card>

      {pedido && (
        <div className="adm-overlay right" onMouseDown={(e) => { if (e.target === e.currentTarget) setAbierto(null); }}>
          <aside className="adm-drawer" role="dialog" aria-label="Detalle del pedido">
            <div className="adm-modal-head">
              <span className="cell-av" style={{ width: 40, height: 40 }}>{iniciales(pedido.clienteNombre)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="ell">{pedido.clienteNombre}</h2>
                <p>Pedido {numeroPedido(pedido.id)} · {fechaCorta(fechaDe(pedido))} · {pedido.metodoPago}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setAbierto(null)} aria-label="Cerrar"><X /></button>
            </div>
            <div className="adm-modal-body" style={{ flex: 1 }}>
              <div className="flex flex-wrap items-center gap-2">
                {/* Cambia lo que ve el cliente en su link de seguimiento. */}
                <select
                  className="select" style={{ width: 'auto', minHeight: 34 }}
                  value={pedido.estado}
                  aria-label="Estado del pedido"
                  onChange={(e) => cambiar(pedido, e.target.value)}
                >
                  {!ESTADOS_PEDIDO.includes(pedido.estado) && <option value={pedido.estado}>{etiqueta(pedido.estado)}</option>}
                  {ESTADOS_PEDIDO.map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => copiarLink(pedido)}><Link2 />Link de seguimiento</button>
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

              <div className="flex flex-col gap-2">
                {pedido.descuentoARS > 0 && <div className="notice info">Descuento efectivo 5% aplicado · −{pesos(pedido.descuentoARS)}</div>}
                <div className="total-bar"><span className="dim">Total</span><span className="num" style={{ fontSize: 26, fontWeight: 300 }}>{pesos(pedido.totalARS)}</span></div>
              </div>

              <div className="adm-modal-foot">
                {esNuevo(pedido) && <button className="btn btn-primary" onClick={() => cambiar(pedido, 'preparando')}><Check />Pago confirmado</button>}
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
