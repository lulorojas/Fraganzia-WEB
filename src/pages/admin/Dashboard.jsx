import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';

const ACCESOS = [
  { to: '/admin/perfumes', label: 'Perfumes', desc: 'Alta, edición y disponibilidad' },
  { to: '/admin/pedidos', label: 'Pedidos', desc: 'Consultar pedidos confirmados' },
  { to: '/admin/promociones', label: 'Promociones', desc: 'Banners de la portada' },
  { to: '/admin/config', label: 'Configuración', desc: 'WhatsApp y dólar de respaldo' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Panel de administración</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map((item) => (
          <Link key={item.to} to={item.to}>
            <GlassCard className="h-full transition-base hover:glow">
              <h2 className="font-display text-lg text-text">{item.label}</h2>
              <p className="mt-1 text-sm text-text-secondary">{item.desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
