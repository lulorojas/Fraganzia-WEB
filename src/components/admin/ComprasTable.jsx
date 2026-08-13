import { Button } from '../ui/Button';
import { formatARS } from '../../utils/format';

export function ComprasTable({ compras, socios, onEditar, onAnular }) {
  if (!compras?.length) {
    return <p className="text-text-secondary">No hay compras cargadas.</p>;
  }

  function nombreSocio(id) {
    return socios?.find((s) => s.id === id)?.nombre ?? id;
  }

  function confirmarAnular(c) {
    if (window.confirm(`¿Anular la compra a "${c.proveedor}"? El stock que generó se resta.`)) {
      onAnular(c);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="pb-2 pr-4">Proveedor</th>
            <th className="pb-2 pr-4">Perfumes</th>
            <th className="pb-2 pr-4">Monto total</th>
            <th className="pb-2 pr-4">Pagos</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {compras.map((c) => (
            <tr key={c.id} className="border-b border-border">
              <td className="py-2 pr-4 font-body">{c.proveedor}</td>
              <td className="py-2 pr-4">
                {(c.items || []).map((i) => `${i.perfumeNombre} ×${i.cantidad}`).join(' · ')}
              </td>
              <td className="py-2 pr-4 font-luxury">{formatARS(c.montoTotal)}</td>
              <td className="py-2 pr-4 text-xs text-text-secondary">
                {(c.pagos || []).map((p) => `${nombreSocio(p.socioId)}: ${formatARS(p.monto)}`).join(' · ')}
              </td>
              <td className="py-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(c)}>
                    Editar
                  </Button>
                  <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(c)}>
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
