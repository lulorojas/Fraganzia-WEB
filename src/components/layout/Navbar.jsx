import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { state } = useCart();
  const { user, isAdmin } = useAuth();
  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nombreCorto = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0];

  return (
    <>
      <nav className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl text-text">
          Fraganzia
        </Link>

        <div className="flex items-center gap-5 font-body text-text-secondary">
          <Link to="/catalogo" className="transition-base hover:text-text hidden sm:block">
            Catálogo
          </Link>
          <Link to="/sobre-nosotros" className="transition-base hover:text-text hidden md:block">
            Nosotros
          </Link>
          <Link to="/contacto" className="transition-base hover:text-text hidden md:block">
            Contacto
          </Link>

          {/* Carrito */}
          <Link to="/carrito" className="relative flex items-center transition-base hover:text-text">
            <ShoppingBag size={20} />
            {cantidadItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] text-text">
                {cantidadItems}
              </span>
            )}
          </Link>

          {/* Usuario */}
          {!user ? (
            <button
              onClick={() => setAuthOpen(true)}
              className="transition-base hover:text-text"
              aria-label="Iniciar sesión"
            >
              <User size={20} />
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 transition-base hover:text-text"
              >
                <User size={20} />
                <span className="text-xs hidden sm:block">{nombreCorto}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 glass z-50 min-w-[160px] p-2 flex flex-col gap-0.5 rounded-xl">
                  <p className="px-3 py-1 text-xs text-text-secondary truncate">{user.email}</p>
                  <div className="border-t border-border my-1" />
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-lila hover:text-text transition-base"
                    >
                      <Settings size={14} />
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut(auth); setMenuOpen(false); }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-error transition-base"
                  >
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
