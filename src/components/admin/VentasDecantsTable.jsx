import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatARS } from '../../utils/format';

export function VentasDecantsTable({ ventas, socios, onEditar, onAnular }) {
  if (!ventas?.length) {
    return <p className="text-text-secondary">No hay ventas de decants cargadas.</p>;
  }

  function nombreSocio(id) {
    return socios?.find((s) => s.id === id)?.nombre ?? id;
  }

  function confirmarAnular(v) {
    if (window.confirm(`¿Anular la venta de decant de "${v.perfumeNombre}"?`)) {
      onAnular(v);
    }
  }

  function Acciones({ v }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(v)}>
          Editar
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(v)}>
          Anular
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: tarjetas */}
      <div className="flex flex-col gap-3 md:hidden">
        {ventas.map((v) => (
          <div key={v.id} className="glass p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-body text-text">{v.perfumeNombre}</p>
              <Badge>{v.tamano}</Badge>
            </div>
            <p className="font-luxury text-lg text-text">{formatARS(v.cantidad * v.precioUnitario)}</p>
            <p className="mb-3 text-xs text-text-secondary">
              {v.cantidad} u. · {nombreSocio(v.vendidoPor)}
            </p>
            <Acciones v={v} />
          </div>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm text-text">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="pb-2 pr-4">Perfume</th>
              <th className="pb-2 pr-4">Tamaño</th>
              <th className="pb-2 pr-4">Cant.</th>
              <th className="pb-2 pr-4">Importe</th>
              <th className="pb-2 pr-4">Vendido por</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="border-b border-border">
                <td className="py-2 pr-4 font-body">{v.perfumeNombre}</td>
                <td className="py-2 pr-4">{v.tamano}</td>
                <td className="py-2 pr-4">{v.cantidad}</td>
                <td className="py-2 pr-4 font-luxury">{formatARS(v.cantidad * v.precioUnitario)}</td>
                <td className="py-2 pr-4">{nombreSocio(v.vendidoPor)}</td>
                <td className="py-2"><Acciones v={v} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
