import { useState } from 'react';
import { useAuditoria } from '../../hooks/useAuditoria';
import { SOCIOS } from '../../constants';
import { Card, CardTitle, Tag, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos } from '../../components/admin/ui/formato';

const COLECCIONES = {
  ventasSocios: 'Ventas',
  ventasDecants: 'Decants',
  compras: 'Compras',
  gastos: 'Gastos',
  movimientosPersonales: 'Retiros y aportes',
  transferenciasSocios: 'Transferencias',
  ajustesStock: 'Ajustes de stock',
  cambiosMetodo: 'Pasajes de dinero',
};

const ACCIONES = {
  create: { label: 'Alta', tone: 'ok' },
  update: { label: 'Edición', tone: 'accent' },
  void: { label: 'Anulación', tone: 'bad' },
};

const nombreSocio = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id ?? '—';

function fechaHora(e) {
  const d = e.modificadoAt?.toDate ? e.modificadoAt.toDate() : null;
  return d ? d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function serializar(v) {
  if (v == null) return '—';
  if (Array.isArray(v)) {
    return v.map((x) => (x && typeof x === 'object'
      ? (x.perfumeNombre ? `${x.perfumeNombre} ×${x.cantidad}` : x.socioId ? `${nombreSocio(x.socioId)} ${pesos(x.monto)}` : JSON.stringify(x))
      : String(x))).join(', ');
  }
  if (typeof v === 'object') {
    if (v.toDate) return v.toDate().toLocaleDateString('es-AR');
    return JSON.stringify(v);
  }
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}

const OCULTOS = ['createdAt', 'updatedAt', 'creadoPor', 'anulado', 'id'];

export default function AdminAuditoria() {
  const [filtros, setFiltros] = useState({ coleccion: '', socioId: '', desde: '', hasta: '' });
  const { data: entradas, isLoading } = useAuditoria(filtros);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const sel = entradas?.find((e) => e.id === seleccionadaId) ?? null;

  const poner = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));

  const campos = sel
    ? Array.from(new Set([...Object.keys(sel.valorAnterior ?? {}), ...Object.keys(sel.valorNuevo ?? {})])).filter((c) => !OCULTOS.includes(c))
    : [];

  return (
    <div className="adm-stack">
      <div className="notice info">
        Incluye todos los movimientos compartidos más tus retiros, aportes y pasajes de dinero. Lo privado del otro socio no aparece acá.
      </div>

      <Card i={0}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="field"><label>Tipo de movimiento</label>
            <select className="select" value={filtros.coleccion} onChange={(e) => poner('coleccion', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(COLECCIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field"><label>Socio</label>
            <select className="select" value={filtros.socioId} onChange={(e) => poner('socioId', e.target.value)}>
              <option value="">Todos</option>
              {SOCIOS.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="field"><label>Desde</label><input type="date" className="input" value={filtros.desde} onChange={(e) => poner('desde', e.target.value)} /></div>
          <div className="field"><label>Hasta</label><input type="date" className="input" value={filtros.hasta} onChange={(e) => poner('hasta', e.target.value)} /></div>
        </div>
      </Card>

      {isLoading ? <Cargando /> : (
        <div className="adm-row" style={{ alignItems: 'flex-start' }}>
          <Card i={1} className="flush" style={{ flex: '1 1 380px', gap: 0 }}>
            {!entradas?.length && <Empty>No hay entradas de auditoría para este filtro.</Empty>}
            <div style={{ maxHeight: 620, overflowY: 'auto' }}>
              {entradas?.map((e) => {
                const acc = ACCIONES[e.accion] ?? { label: e.accion, tone: 'neutral' };
                return (
                  <button
                    key={e.id}
                    onClick={() => setSeleccionadaId(e.id)}
                    className="tr click"
                    style={{ '--cols': 'auto 1fr auto', width: '100%', border: 0, textAlign: 'left', color: 'inherit', background: e.id === seleccionadaId ? 'rgba(192,132,252,.12)' : undefined }}
                  >
                    <Tag tone={acc.tone}>{acc.label}</Tag>
                    <div style={{ minWidth: 0 }}><div className="ell" style={{ fontWeight: 500 }}>{COLECCIONES[e.coleccion] ?? e.coleccion}</div><div className="card-note">{nombreSocio(e.modificadoPor)}</div></div>
                    <span className="card-note">{fechaHora(e)}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card i={2} style={{ flex: '1.2 1 380px' }}>
            {!sel ? <Empty>Elegí una entrada del historial para ver el detalle.</Empty> : (
              <>
                <CardTitle>{COLECCIONES[sel.coleccion] ?? sel.coleccion}</CardTitle>
                <span className="card-note">{(ACCIONES[sel.accion] ?? {}).label} por {nombreSocio(sel.modificadoPor)} · {fechaHora(sel)}</span>
                <div className="tbl-scroll">
                  <div className="tbl" style={{ '--cols': '120px 1fr 1fr', '--min': '420px' }}>
                    <div className="tr head"><span>Campo</span><span>Antes</span><span>Después</span></div>
                    {campos.map((c) => (
                      <div key={c} className="tr" style={{ alignItems: 'start' }}>
                        <span className="dim">{c}</span>
                        <span className="faint" style={{ wordBreak: 'break-word' }}>{serializar(sel.valorAnterior?.[c])}</span>
                        <span style={{ wordBreak: 'break-word' }}>{serializar(sel.valorNuevo?.[c])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
