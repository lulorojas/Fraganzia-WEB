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

  function Acciones({ g }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(g)}>
          Editar
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(g)}>
          Anular
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: tarjetas */}
      <div className="flex flex-col gap-3 md:hidden">
        {gastos.map((g) => (
          <div key={g.id} className="glass p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-body text-text">{g.descripcion}</p>
              <Badge>{g.categoria}</Badge>
            </div>
            <p className="font-luxury text-lg text-text">{formatARS(g.monto)}</p>
            <p className="mb-3 text-xs text-text-secondary">Pagó {nombreSocio(g.pagadoPor)}</p>
            <Acciones g={g} />
          </div>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
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
                <td className="py-2"><Acciones g={g} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
