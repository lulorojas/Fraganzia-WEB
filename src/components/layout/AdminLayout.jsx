import { Link, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/perfumes', label: 'Perfumes' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/promociones', label: 'Promociones' },
  { to: '/admin/config', label: 'Configuración' },
  { to: '/admin/ventas', label: 'Ventas' },
  { to: '/admin/compras', label: 'Compras' },
  { to: '/admin/decants', label: 'Decants' },
  { to: '/admin/gastos', label: 'Gastos' },
  { to: '/admin/movimientos', label: 'Movimientos' },
  { to: '/admin/auditoria', label: 'Auditoría' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export function AdminLayout({ children }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <nav className="glass flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6 font-body text-text-secondary">
          <span className="font-display text-lg text-text">Fraganzia Admin</span>
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="transition-base hover:text-text">
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl px-3 py-1.5 text-sm text-text-secondary transition-base hover:text-error"
        >
          Cerrar sesión
        </button>
      </nav>
      <main className="p-6">{children ?? <Outlet />}</main>
    </div>
  );
}
