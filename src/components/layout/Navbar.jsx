import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Instagram, User, LogOut, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { LogoFraganzia } from '../ui/LogoFraganzia';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { state } = useCart();
  const { user, isAdmin } = useAuth();
  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
      <nav className="glass-frosted sticky top-0 z-40 backdrop-blur-[32px] border-b border-violet/10">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          {/* Logo izquierda */}
          <Link to="/" className="transition-all duration-300 hover:opacity-80 hover:scale-105">
            <LogoFraganzia size={1.2} />
          </Link>

          {/* Links centro (ocultos en mobile) */}
          <div className="hidden lg:flex items-center gap-8 font-body text-text-secondary text-sm absolute left-1/2 -translate-x-1/2">
            <Link to="/catalogo" className="transition-all duration-200 hover:text-text hover:scale-105">
              Catálogo
            </Link>
            <Link to="/sobre-nosotros" className="transition-all duration-200 hover:text-text hover:scale-105">
              Nosotros
            </Link>
            <Link to="/contacto" className="transition-all duration-200 hover:text-text hover:scale-105">
              Contacto
            </Link>
          </div>

          {/* Actions derecha */}
          <div className="flex items-center justify-end gap-4 font-body text-text-secondary">
            <a
              href="https://www.instagram.com/fraganzia.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 transition-all duration-200 hover:text-lila hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram size={19} />
            </a>

            {/* Carrito */}
            <Link to="/carrito" className="relative flex items-center transition-all duration-200 hover:text-text hover:scale-110">
              <ShoppingBag size={21} />
              {cantidadItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet to-lila text-[11px] font-bold text-white shadow-lg ring-2 ring-bg animate-pulse">
                  {cantidadItems}
                </span>
              )}
            </Link>

            {/* Usuario */}
            {!user ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="transition-all duration-200 hover:text-text hover:scale-110"
                aria-label="Iniciar sesión"
              >
                <User size={20} />
              </button>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 transition-all duration-200 hover:text-text"
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
        </div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

