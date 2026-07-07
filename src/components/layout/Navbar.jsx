import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export function Navbar() {
  const { state } = useCart();
  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <nav className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
      <Link to="/" className="font-display text-xl text-text">
        Fraganzia
      </Link>
      <div className="flex items-center gap-6 font-body text-text-secondary">
        <Link to="/catalogo" className="transition-base hover:text-text">
          Catálogo
        </Link>
        <Link to="/carrito" className="relative flex items-center transition-base hover:text-text">
          <ShoppingBag size={20} />
          {cantidadItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] text-text">
              {cantidadItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
