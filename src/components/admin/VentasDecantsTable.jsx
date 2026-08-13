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

  return (
    <div className="overflow-x-auto">
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
              <td className="py-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(v)}>
                    Editar
                  </Button>
                  <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(v)}>
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
