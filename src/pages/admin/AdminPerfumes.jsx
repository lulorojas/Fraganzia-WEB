import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useStock } from '../../hooks/useStock';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { actualizarActivo, editarPerfume, eliminarPerfume } from '../../services/perfumesService';
import { precioListaARS } from '../../utils/precios';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, Kpi, Switch, Thumb, Cargando, Empty } from '../../components/admin/ui/kit';
import { pesos } from '../../components/admin/ui/formato';

const COLS = 'minmax(220px,1.6fr) 150px 70px 96px 96px 84px';

export default function AdminPerfumes() {
  const qc = useQueryClient();
  const { abrir, avisar } = useAdminActions();
  const { data: perfumes, isLoading } = usePerfumesAdmin();
  const { stock } = useStock();
  const { dolarMedio } = useDolarBlue();
  const [q, setQ] = useState('');
  const [marca, setMarca] = useState('Todas');

  const lista = useMemo(() => perfumes ?? [], [perfumes]);
  const marcas = useMemo(() => ['Todas', ...Array.from(new Set(lista.map((p) => p.marca).filter(Boolean))).sort()], [lista]);

  const filtrados = lista
    .filter((p) => marca === 'Todas' || p.marca === marca)
    .filter((p) => {
      const t = q.trim().toLowerCase();
      return !t || p.nombre?.toLowerCase().includes(t) || p.marca?.toLowerCase().includes(t);
    });

  const refrescar = () => qc.invalidateQueries({ queryKey: ['perfumes'] });

  async function alternarPublicado(p) {
    await actualizarActivo(p.id, !p.activo);
    refrescar();
  }

  async function alternarDestacado(p) {
    await editarPerfume(p.id, { destacado: !p.destacado });
    refrescar();
  }

  async function borrar(p) {
    if (!window.confirm(`¿Eliminar "${p.nombre}" permanentemente de la base de datos? Esta acción no se puede deshacer.`)) return;
    await eliminarPerfume(p.id);
    refrescar();
    avisar('Perfume eliminado');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div className="grid-auto">
        <Kpi i={0} label="Perfumes en catálogo" value={lista.length} />
        <Kpi i={1} label="Publicados" value={lista.filter((p) => p.activo).length} />
        <Kpi i={2} label="Destacados" value={lista.filter((p) => p.destacado).length} />
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="input-wrap" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Search />
          <input className="input" placeholder="Buscar perfume o marca" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => abrir('perfume')}><Plus />Nuevo perfume</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {marcas.map((m) => (
          <button key={m} className={`chip ${m === marca ? 'on' : ''}`} onClick={() => setMarca(m)}>{m}</button>
        ))}
      </div>

      <Card i={3} className="flush" style={{ gap: 0 }}>
        <div className="tbl-scroll">
          <div className="tbl" style={{ '--cols': COLS, '--min': '780px' }}>
            <div className="tr head"><span>Perfume</span><span>Precio</span><span>Stock</span><span>Publicado</span><span>Destacado</span><span /></div>
            {filtrados.map((p) => {
              const ars = precioListaARS(p, dolarMedio);
              return (
                <div key={p.id} className="tr">
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb perfume={p} size={40} />
                    <div className="min-w-0"><div className="ell" style={{ fontWeight: 500 }}>{p.nombre}</div><div className="faint" style={{ fontSize: 12 }}>{p.marca}</div></div>
                  </div>
                  <div><div className="num" style={{ fontWeight: 500 }}>US$ {p.precioUSD}</div><div className="faint" style={{ fontSize: 12 }}>{ars ? pesos(ars) : '—'}</div></div>
                  <span className="num">{stock[p.id] ?? 0}</span>
                  <Switch on={Boolean(p.activo)} onChange={() => alternarPublicado(p)} label={`Publicar ${p.nombre}`} />
                  <Switch on={Boolean(p.destacado)} onChange={() => alternarDestacado(p)} label={`Destacar ${p.nombre}`} />
                  <div className="flex justify-end gap-1">
                    <button className="btn btn-ghost btn-icon" title="Editar" aria-label={`Editar ${p.nombre}`} onClick={() => abrir('perfume', { editando: p })}><Pencil /></button>
                    <button className="btn btn-ghost btn-icon btn-bad" title="Eliminar" aria-label={`Eliminar ${p.nombre}`} onClick={() => borrar(p)}><Trash2 /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {filtrados.length === 0 && <Empty>No hay perfumes que coincidan.</Empty>}
      </Card>
    </div>
  );
}
