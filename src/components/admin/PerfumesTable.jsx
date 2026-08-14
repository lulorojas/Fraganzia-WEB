import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

export function PerfumesTable({ perfumes, onEditar, onToggleDisponible, onToggleActivo, onEliminar }) {
  if (!perfumes?.length) {
    return (
      <GlassCard className="py-10 text-center">
        <p className="font-body text-text-secondary">No hay perfumes cargados.</p>
      </GlassCard>
    );
  }

  function confirmarEliminar(p) {
    if (window.confirm(`¿Eliminar "${p.nombre}" permanentemente de la base de datos? Esta acción no se puede deshacer.`)) {
      onEliminar(p.id);
    }
  }

  return (
    <GlassCard>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Nombre</th>
            <th className="pb-2 pr-4">Marca</th>
            <th className="pb-2 pr-4">USD</th>
            <th className="pb-2 pr-4">Estado</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {perfumes.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="py-2 pr-4 font-body">{p.nombre}</td>
              <td className="py-2 pr-4">
                <Badge>{p.marca}</Badge>
              </td>
              <td className="py-2 pr-4 font-luxury">${p.precioUSD}</td>
              <td className="py-2 pr-4">
                <div className="flex gap-1 flex-wrap">
                  {p.activo ? (
                    <span className="text-success text-xs">Activo</span>
                  ) : (
                    <span className="text-error text-xs">Inactivo</span>
                  )}
                  {p.disponible ? (
                    <span className="text-success text-xs">· Stock</span>
                  ) : (
                    <span className="text-error text-xs">· Sin stock</span>
                  )}
                  {p.destacado && <span className="text-lila text-xs">· Destacado</span>}
                </div>
              </td>
              <td className="py-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(p)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => onToggleDisponible(p)}
                  >
                    {p.disponible ? 'Sin stock' : 'Con stock'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => onToggleActivo(p)}
                  >
                    {p.activo ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs px-2 py-1 text-error"
                    onClick={() => confirmarEliminar(p)}
                  >
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
