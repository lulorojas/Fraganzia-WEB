import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Droplet, ShoppingCart, Receipt, ArrowLeftRight, History,
} from 'lucide-react';

const TABS = [
  { to: '.', label: 'Resumen', Icon: LayoutDashboard, end: true },
  { to: 'ventas', label: 'Ventas', Icon: TrendingUp },
  { to: 'decants', label: 'Decants', Icon: Droplet },
  { to: 'compras', label: 'Compras', Icon: ShoppingCart },
  { to: 'gastos', label: 'Gastos', Icon: Receipt },
  { to: 'movimientos', label: 'Movimientos', Icon: ArrowLeftRight },
  { to: 'historial', label: 'Historial', Icon: History },
];

export default function AdminFinanzasLayout() {
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl text-text">Administración Financiera</h1>
      <nav className="glass mb-6 flex flex-wrap gap-2 p-2">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-body transition-base ${
                isActive ? 'gradient-violet text-text glow' : 'text-text-secondary hover:text-text'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
