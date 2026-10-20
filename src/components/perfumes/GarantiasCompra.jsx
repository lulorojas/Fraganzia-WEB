import { BadgeCheck, PackageSearch, Truck, Wallet } from 'lucide-react';

// Solo lo que la tienda ya dice y hace hoy en el resto del sitio (envíos solo en
// AMBA, pago por transferencia o efectivo con precio diferenciado, seguimiento
// del pedido con link). No agregar plazos ni políticas que no estén confirmados.
const ITEMS = [
  { Icono: BadgeCheck, texto: 'Perfumes 100% originales' },
  { Icono: Truck, texto: 'Envíos a todo el AMBA' },
  { Icono: Wallet, texto: 'Transferencia o efectivo, con precio diferenciado' },
  { Icono: PackageSearch, texto: 'Seguí tu pedido online con un link' },
];

/** Razones para comprar tranquilo, justo debajo del botón de compra. */
export function GarantiasCompra() {
  return (
    <ul aria-label="Cómo comprás en Fraganzia" className="grid gap-2 sm:grid-cols-2">
      {ITEMS.map(({ Icono, texto }) => (
        <li key={texto} className="flex items-center gap-2 font-body text-xs text-text-secondary">
          <Icono size={16} className="shrink-0 text-lila" aria-hidden="true" />
          {texto}
        </li>
      ))}
    </ul>
  );
}
