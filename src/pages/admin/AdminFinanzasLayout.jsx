import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Droplet, ShoppingCart, Receipt, ArrowLeftRight, History, BarChart3, Package,
} from 'lucide-react';

const TABS = [
  { to: '.', label: 'Resumen', Icon: LayoutDashboard, end: true },
  { to: 'ventas', label: 'Ventas', Icon: TrendingUp },
  { to: 'decants', label: 'Decants', Icon: Droplet },
  { to: 'compras', label: 'Compras', Icon: ShoppingCart },
  { to: 'gastos', label: 'Gastos', Icon: Receipt },
  { to: 'stock', label: 'Stock', Icon: Package },
  { to: 'movimientos', label: 'Movimientos', Icon: ArrowLeftRight },
  { to: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { to: 'auditoria', label: 'Auditoría', Icon: History },
];

export default function AdminFinanzasLayout() {
  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-text sm:text-2xl">Administración Financiera</h1>

      {/* En mobile scrollea horizontal en una sola fila; en desktop envuelve. */}
      <nav className="glass mb-6 -mx-1 flex gap-2 overflow-x-auto p-2 sm:mx-0 sm:flex-wrap sm:overflow-visible">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-body transition-base ${
                isActive ? 'gradient-violet text-text glow' : 'text-text-secondary hover:text-text'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
