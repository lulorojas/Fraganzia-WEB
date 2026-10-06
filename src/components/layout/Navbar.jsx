import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Instagram, User, LogOut, Settings, Menu, X, Heart, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavoritos } from '../../context/FavoritosContext';
import { LogoFraganzia } from '../ui/LogoFraganzia';
import { abrirAsistente } from '../asistente/BotonAsistente';

// El modal de login (con react-hook-form, zod y framer-motion) solo se
// descarga cuando alguien lo abre: la mayoría de las visitas nunca lo usa.
const AuthModal = lazy(() => import('./AuthModal').then((m) => ({ default: m.AuthModal })));

const LINKS = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

// Cierra un menú desplegable al hacer click afuera o apretar Escape.
function useCerrarAlSalir(ref, abierto, cerrar) {
  useEffect(() => {
    if (!abierto) return undefined;
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) cerrar();
    }
    function onKey(e) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, abierto, cerrar]);
}

export function Navbar() {
  const { state } = useCart();
  const { user, isAdmin } = useAuth();
  const { ids: favoritos } = useFavoritos();
  const { pathname } = useLocation();
  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authCargado, setAuthCargado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  useCerrarAlSalir(menuRef, menuOpen, () => setMenuOpen(false));
  useCerrarAlSalir(mobileRef, mobileOpen, () => setMobileOpen(false));

  // Al navegar, cerrar el menú mobile.
  useEffect(() => setMobileOpen(false), [pathname]);

  function abrirLogin() {
    setAuthCargado(true);
    setAuthOpen(true);
  }

  const nombreCorto = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0];
  const claseLink = ({ isActive }) =>
    `transition-colors duration-200 hover:text-text ${isActive ? 'text-text' : ''}`;

  return (
    <>
      <nav
        ref={mobileRef}
        aria-label="Principal"
        className="glass-frosted sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b border-violet/10"
      >
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          {/* Logo izquierda */}
          <Link to="/" aria-label="Fraganzia, ir al inicio" className="transition-opacity duration-300 hover:opacity-80">
            <LogoFraganzia size={1.2} />
          </Link>

          {/* Links centro (desktop) */}
          <div className="hidden lg:flex items-center gap-8 font-body text-text-secondary text-sm absolute left-1/2 -translate-x-1/2">
            {LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={claseLink}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Actions derecha */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 font-body text-text-secondary">
            <button
              type="button"
              onClick={abrirAsistente}
              aria-label="Encontrá tu perfume"
              className="mr-1 flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-br from-violet to-violet-light px-3 text-sm font-semibold text-white shadow-md shadow-violet/30 transition-transform duration-200 hover:scale-105 active:scale-95 sm:px-4"
            >
              <Sparkles size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Encontrá tu perfume</span>
            </button>

            <a
              href="https://www.instagram.com/fraganzia.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-lila"
              aria-label="Instagram de Fraganzia"
            >
              <Instagram size={19} aria-hidden="true" />
            </a>

            {/* Favoritos (en mobile está en el menú, para no apretar la barra) */}
            <Link
              to="/favoritos"
              aria-label={favoritos.length ? `Favoritos, ${favoritos.length} guardados` : 'Favoritos'}
              className="relative hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-text"
            >
              <Heart size={20} aria-hidden="true" />
              {favoritos.length > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-[#E11D74] text-[11px] font-bold text-white ring-2 ring-bg"
                >
                  {favoritos.length}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <Link
              to="/carrito"
              aria-label={cantidadItems > 0 ? `Carrito, ${cantidadItems} ${cantidadItems === 1 ? "producto" : "productos"}` : "Carrito"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-text"
            >
              <ShoppingBag size={21} aria-hidden="true" />
              {cantidadItems > 0 && (
                <span
                  // La key cambia con la cantidad: React recrea el badge y la
                  // animación "bump" vuelve a correr en cada agregado.
                  key={cantidadItems}
                  aria-hidden="true"
                  className="absolute top-0 right-0 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-violet text-[11px] font-bold text-white shadow-lg ring-2 ring-bg animate-bump"
                >
                  {cantidadItems}
                </span>
              )}
            </Link>

            {/* Usuario */}
            {!user ? (
              <button
                type="button"
                onClick={abrirLogin}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-text"
                aria-label="Iniciar sesión"
              >
                <User size={20} aria-hidden="true" />
              </button>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Menú de usuario"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-1.5 rounded-full px-2 transition-colors duration-200 hover:text-text"
                >
                  <User size={20} aria-hidden="true" />
                  <span className="text-xs hidden sm:block">{nombreCorto}</span>
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-11 glass-frosted z-50 min-w-[180px] p-2 flex flex-col gap-0.5 rounded-xl">
                    <p className="px-3 py-1 text-xs text-text-secondary truncate">{user.email}</p>
                    <div className="border-t border-border my-1" />
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-lila hover:text-text transition-base"
                      >
                        <Settings size={14} aria-hidden="true" />
                        Panel Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { signOut(auth); setMenuOpen(false); }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-error transition-base"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Menú mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobile"
              className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-text"
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="menu-mobile" className="lg:hidden border-t border-violet/10 px-4 pb-4 pt-2">
            <ul className="flex flex-col font-body">
              <li>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); abrirAsistente(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-lila transition-colors hover:bg-violet/10 hover:text-text"
                >
                  <Sparkles size={18} aria-hidden="true" />
                  Encontrá tu perfume
                </button>
              </li>
              {LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 text-base transition-colors hover:bg-violet/10 hover:text-text ${isActive ? 'text-text' : 'text-text-secondary'}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/favoritos"
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-3 text-base transition-colors hover:bg-violet/10 hover:text-text ${isActive ? 'text-text' : 'text-text-secondary'}`
                  }
                >
                  <Heart size={18} aria-hidden="true" />
                  Favoritos{favoritos.length > 0 && ` (${favoritos.length})`}
                </NavLink>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/fraganzia.ar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-base text-text-secondary transition-colors hover:bg-violet/10 hover:text-lila"
                >
                  <Instagram size={18} aria-hidden="true" />
                  @fraganzia.ar
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {authCargado && (
        <Suspense fallback={null}>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
