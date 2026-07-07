import { Button } from '../ui/Button';

export function PromocionesTable({ promociones, onEditar, onEliminar, onToggleActiva }) {
  if (!promociones?.length) return <p className="text-text-secondary">No hay promociones.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Orden</th>
            <th className="pb-2 pr-4">Título</th>
            <th className="pb-2 pr-4">Estado</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promociones.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="py-2 pr-4 text-text-secondary">{p.orden}</td>
              <td className="py-2 pr-4">{p.titulo}</td>
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
  );
}
