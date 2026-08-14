import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

const TIPO_LABEL = { descuento: 'Descuento', '2x1': '2×1', otro: 'Otro' };

export function PromocionesTable({ promociones, onEditar, onEliminar, onToggleActiva }) {
  if (!promociones?.length) return (
    <GlassCard className="py-10 text-center">
      <p className="font-body text-text-secondary">No hay promociones.</p>
    </GlassCard>
  );

  return (
    <GlassCard>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Orden</th>
            <th className="pb-2 pr-4">Título</th>
            <th className="pb-2 pr-4">Tipo</th>
            <th className="pb-2 pr-4">Estado</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promociones.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="py-2 pr-4 text-text-secondary">{p.orden}</td>
              <td className="py-2 pr-4">{p.titulo}</td>
              <td className="py-2 pr-4 text-xs text-lila">{TIPO_LABEL[p.tipo] ?? p.tipo ?? '—'}</td>
              <td className="py-2 pr-4">
                {p.activa
                  ? <span className="text-success text-xs">Activa</span>
                  : <span className="text-error text-xs">Inactiva</span>
                }
              </td>
              <td className="py-2">
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(p)}>
                    Editar
                  </Button>
                  <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => onToggleActiva(p)}>
                    {p.activa ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => onEliminar(p.id)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
