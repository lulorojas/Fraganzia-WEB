import { BadgeCheck, PackageSearch, Truck, Wallet } from 'lucide-react';

// Solo lo que la tienda ya dice y hace hoy en el resto del sitio (envíos solo en
// AMBA, pago por transferencia o efectivo con precio diferenciado, seguimiento
// del pedido con link). No agregar plazos ni políticas que no estén confirmados.
// Es la única fuente de estos mensajes: la portada y la ficha la reusan.
const ITEMS = [
  { Icono: BadgeCheck, texto: 'Perfumes 100% originales', corto: '100% originales' },
  { Icono: Truck, texto: 'Envíos a todo el AMBA', corto: 'Envíos en AMBA' },
  { Icono: Wallet, texto: 'Transferencia o efectivo, con precio diferenciado', corto: 'Transferencia o efectivo' },
  { Icono: PackageSearch, texto: 'Seguí tu pedido online con un link', corto: 'Seguí tu pedido online' },
];

/**
 * Razones para comprar tranquilo. `lista` (por defecto) va debajo del botón de
 * compra de la ficha; `franja` es la fila de la portada.
 */
export function GarantiasCompra({ variante = 'lista' }) {
  if (variante === 'franja') {
    return (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
        {ITEMS.map(({ Icono, corto }) => (
          <li key={corto} className="flex items-center justify-center gap-2.5 font-body text-[13px] text-text sm:text-sm">
            <Icono size={18} className="shrink-0 text-gold" aria-hidden="true" />
            {corto}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul aria-label="Cómo comprás en Fraganzia" className="grid gap-2 sm:grid-cols-2">
      {ITEMS.map(({ Icono, texto }) => (
        <li key={texto} className="flex items-center gap-2 font-body text-xs text-text-secondary">
          <Icono size={16} className="shrink-0 text-gold" aria-hidden="true" />
          {texto}
        </li>
      ))}
    </ul>
  );
}
