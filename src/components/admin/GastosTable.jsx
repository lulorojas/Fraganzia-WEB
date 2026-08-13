import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatARS } from '../../utils/format';

export function GastosTable({ gastos, socios, onEditar, onAnular }) {
  if (!gastos?.length) {
    return <p className="text-text-secondary">No hay gastos cargados.</p>;
  }

  function nombreSocio(id) {
    return socios?.find((s) => s.id === id)?.nombre ?? id;
  }

  function confirmarAnular(g) {
    if (window.confirm(`¿Anular el gasto "${g.descripcion}"?`)) {
      onAnular(g);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Categoría</th>
            <th className="pb-2 pr-4">Descripción</th>
            <th className="pb-2 pr-4">Monto</th>
            <th className="pb-2 pr-4">Pagado por</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {gastos.map((g) => (
            <tr key={g.id} className="border-b border-border">
              <td className="py-2 pr-4"><Badge>{g.categoria}</Badge></td>
              <td className="py-2 pr-4 font-body">{g.descripcion}</td>
              <td className="py-2 pr-4 font-luxury">{formatARS(g.monto)}</td>
              <td className="py-2 pr-4">{nombreSocio(g.pagadoPor)}</td>
              <td className="py-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(g)}>
                    Editar
                  </Button>
                  <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(g)}>
                    Anular
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
