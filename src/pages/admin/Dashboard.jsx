import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';
import { usePedidosList } from '../../hooks/usePedidos';
import { formatARS } from '../../utils/format';

const ACCESOS = [
  { to: '/admin/perfumes', label: 'Perfumes', desc: 'Alta, edición y disponibilidad' },
  { to: '/admin/pedidos', label: 'Pedidos', desc: 'Consultar pedidos confirmados' },
  { to: '/admin/promociones', label: 'Promociones', desc: 'Banners de la portada' },
  { to: '/admin/config', label: 'Configuración', desc: 'WhatsApp y dólar de respaldo' },
  { to: '/admin/finanzas', label: 'Finanzas', desc: 'Ventas, compras, gastos y saldo entre socios' },
];

function StatCard({ Icon, label, value, sub }) {
  return (
    <GlassCard className="flex items-center gap-4 p-5">
      <div className="rounded-xl bg-lila/10 p-3">
        <Icon className="h-6 w-6 text-lila" />
      </div>
      <div>
        <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
        <p className="font-display text-xl text-text sm:text-2xl">{value}</p>
        {sub && <p className="text-xs text-text-secondary">{sub}</p>}
      </div>
    </GlassCard>
  );
}

export default function Dashboard() {
  const { data: pedidos, isLoading } = usePedidosList();

  const totalPedidos = pedidos?.length ?? 0;
  const totalARS = pedidos?.reduce((acc, p) => acc + (p.totalARS ?? 0), 0) ?? 0;
  const porTransferencia = pedidos?.filter((p) => p.metodoPago === 'transferencia').length ?? 0;
  const porEfectivo = pedidos?.filter((p) => p.metodoPago === 'efectivo').length ?? 0;

  return (
    <div>
      <h1 className="mb-6 font-display text-xl text-text sm:text-2xl">Panel de administración</h1>

      {/* Estadísticas */}
      <h2 className="mb-3 font-display text-lg text-text-secondary">Estadísticas de pedidos</h2>
      {isLoading ? (
        <div className="mb-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            Icon={ShoppingBag}
            label="Total pedidos"
            value={totalPedidos}
          />
          <StatCard
            Icon={DollarSign}
            label="Facturación total"
            value={formatARS(totalARS)}
            sub="suma de todos los pedidos"
          />
          <StatCard
            Icon={CreditCard}
            label="Por transferencia"
            value={porTransferencia}
            sub={`${totalPedidos ? Math.round((porTransferencia / totalPedidos) * 100) : 0}% del total`}
          />
          <StatCard
            Icon={Banknote}
            label="Por efectivo"
            value={porEfectivo}
            sub={`${totalPedidos ? Math.round((porEfectivo / totalPedidos) * 100) : 0}% del total`}
          />
        </div>
      )}

      {/* Accesos rápidos */}
      <h2 className="mb-3 font-display text-lg text-text-secondary">Accesos rápidos</h2>
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
