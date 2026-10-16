import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTodasLasPromociones, useEditarPromocion, useEliminarPromocion } from '../../hooks/usePromociones';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, Switch, Tag, Cargando, Empty } from '../../components/admin/ui/kit';

const TIPO = { descuento: 'Descuento', '2x1': '2×1', otro: 'Otro' };

export default function AdminPromociones() {
  const { abrir, avisar } = useAdminActions();
  const { data: promociones, isLoading } = useTodasLasPromociones();
  const { mutateAsync: editar } = useEditarPromocion();
  const { mutateAsync: eliminar } = useEliminarPromocion();

  async function borrar(p) {
    if (!window.confirm(`¿Eliminar la promoción "${p.titulo}"?`)) return;
    await eliminar(p.id);
    avisar('Promoción eliminada');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-stack">
      <div>
        <button className="btn btn-primary" onClick={() => abrir('promocion')}><Plus />Nueva promoción</button>
      </div>
      {!promociones?.length ? (
        <Card i={0}><Empty>No hay promociones.</Empty></Card>
      ) : (
        <div className="grid-cards">
          {promociones.map((p, i) => (
            <Card key={p.id} i={i} style={{ gap: 12 }}>
              <div className="flex items-center gap-2">
                <span className="mono faint" style={{ fontSize: 11 }}>#{p.orden}</span>
                <Tag tone="accent">{TIPO[p.tipo] ?? p.tipo ?? '—'}</Tag>
                <Tag tone={p.activa ? 'ok' : 'neutral'} className="ml-auto">{p.activa ? 'Activa' : 'Inactiva'}</Tag>
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontSize: 17 }}>{p.titulo}</div>
                {p.descripcion && <p className="dim" style={{ margin: '4px 0 0' }}>{p.descripcion}</p>}
                {p.tipo === 'descuento' && p.descuentoPorcentaje > 0 && <p className="card-note" style={{ margin: '6px 0 0' }}>{p.descuentoPorcentaje}% de descuento · {p.perfumeIds?.length ? `${p.perfumeIds.length} ${p.perfumeIds.length === 1 ? 'perfume' : 'perfumes'}` : 'todo el catálogo'}</p>}
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 'auto' }}>
                <Switch on={Boolean(p.activa)} onChange={() => editar({ id: p.id, datos: { activa: !p.activa } })} label={`Activar ${p.titulo}`} />
                <span className="card-note" style={{ flex: 1 }}>{p.activa ? 'Visible en el sitio' : 'Oculta'}</span>
                <button className="btn btn-ghost btn-icon" title="Editar" aria-label="Editar" onClick={() => abrir('promocion', { editando: p })}><Pencil /></button>
                <button className="btn btn-ghost btn-icon btn-bad" title="Eliminar" aria-label="Eliminar" onClick={() => borrar(p)}><Trash2 /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
