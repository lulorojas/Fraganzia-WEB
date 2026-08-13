import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/perfumes', label: 'Perfumes' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/promociones', label: 'Promociones' },
  { to: '/admin/config', label: 'Configuración' },
  { to: '/admin/finanzas', label: 'Finanzas' },
];

function linkClass({ isActive }) {
  return `rounded-xl px-3 py-2 text-sm transition-base ${
    isActive ? 'bg-white/5 text-text' : 'text-text-secondary hover:text-text'
  }`;
}

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <nav className="glass px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/admin" className="font-display text-lg text-text">Fraganzia Admin</Link>

          {/* Desktop */}
          <div className="hidden items-center gap-1 font-body lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="hidden rounded-xl px-3 py-1.5 text-sm text-text-secondary transition-base hover:text-error lg:block"
          >
            Cerrar sesión
          </button>

          {/* Mobile */}
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="rounded-xl p-2 text-text-secondary transition-base hover:text-text lg:hidden"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAbierto && (
          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 font-body lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuAbierto(false)}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="mt-1 rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-base hover:text-error"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>
      <main className="p-4 sm:p-6">{children ?? <Outlet />}</main>
    </div>
  );
}
