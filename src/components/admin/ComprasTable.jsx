import { Button } from '../ui/Button';
import { formatARS } from '../../utils/format';
import { pagosDeCompra, totalDeCompra } from '../../services/panelFinancieroCalculos';

export function ComprasTable({ compras, socios, onEditar, onAnular }) {
  if (!compras?.length) {
    return <p className="text-text-secondary">No hay compras cargadas.</p>;
  }

  function nombreSocio(id) {
    return socios?.find((s) => s.id === id)?.nombre ?? id;
  }

  function listaItems(c) {
    return (c.items || []).map((i) => `${i.perfumeNombre} ×${i.cantidad}`).join(' · ');
  }

  // Un solo pagador se muestra por nombre; el reparto, con cuánto puso cada uno.
  function detallePago(c) {
    const pagos = pagosDeCompra(c);
    if (pagos.length === 0) return '—';
    if (pagos.length === 1) return nombreSocio(pagos[0].socioId);
    return pagos.map((p) => `${nombreSocio(p.socioId)} ${formatARS(p.monto)}`).join(' · ');
  }

  function confirmarAnular(c) {
    if (window.confirm(`¿Anular la compra a "${c.proveedor}"? El stock que generó se resta.`)) {
      onAnular(c);
    }
  }

  function Acciones({ c }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => onEditar(c)}>
          Editar
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => confirmarAnular(c)}>
          Anular
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: tarjetas */}
      <div className="flex flex-col gap-3 md:hidden">
        {compras.map((c) => (
          <div key={c.id} className="glass p-4">
            <p className="font-body text-text">{c.proveedor}</p>
            <p className="mb-2 text-xs text-text-secondary">{listaItems(c)}</p>
            <p className="font-luxury text-lg text-text">{formatARS(totalDeCompra(c))}</p>
            <p className="mb-3 text-xs text-text-secondary">Pagó {detallePago(c)}</p>
            <Acciones c={c} />
          </div>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm text-text">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="pb-2 pr-4">Proveedor</th>
              <th className="pb-2 pr-4">Perfumes</th>
              <th className="pb-2 pr-4">Monto total</th>
              <th className="pb-2 pr-4">Pagado por</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="py-2 pr-4 font-body">{c.proveedor}</td>
                <td className="py-2 pr-4">{listaItems(c)}</td>
                <td className="py-2 pr-4 font-luxury">{formatARS(totalDeCompra(c))}</td>
                <td className="py-2 pr-4 text-xs text-text-secondary">{detallePago(c)}</td>
                <td className="py-2"><Acciones c={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
