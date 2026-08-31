import { useMemo } from 'react';
import { ShoppingBag, DollarSign, Receipt, Layers } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';
import { usePedidosList } from '../../hooks/usePedidos';
import { useCompras } from '../../hooks/useCompras';
import { useVentasSocios } from '../../hooks/useVentasSocios';
import { useAjustesStock } from '../../hooks/useAjustesStock';
import { calcularStockPorProducto } from '../../services/panelFinancieroCalculos';
import {
  calcularPerfumesMasPedidos, calcularMarcasMasPedidas, calcularResumenPedidos,
  calcularEvolucionPedidos, calcularOportunidadesReposicion,
} from '../../services/pedidosAnalitica';
import {
  PerfumesMasPedidos, MarcasMasPedidas, OportunidadesReposicion, EvolucionPedidos,
} from '../../components/admin/panel/DashboardAnalitica';
import {
  PerfumesMasVistos, MasBuscados, BusquedasSinResultado, BajaConversion,
} from '../../components/admin/panel/InteresClientes';
import { useInteresClientes } from '../../hooks/useInteresClientes';
import { formatARS } from '../../utils/format';

const VACIO = [];

function StatCard({ Icon, label, value, sub }) {
  return (
    <GlassCard className="flex items-center gap-4 p-5">
      <div className="rounded-xl bg-lila/10 p-3">
        <Icon className="h-6 w-6 text-lila" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="font-display text-xl text-text sm:text-2xl">{value}</p>
        {sub && <p className="text-xs text-text-secondary">{sub}</p>}
      </div>
    </GlassCard>
  );
}

export default function Dashboard() {
  const { data: pedidos, isLoading } = usePedidosList();
  const { data: compras } = useCompras();
  const { data: ventasSocios } = useVentasSocios();
  const { data: ajustesStock } = useAjustesStock();
  const { data: interes } = useInteresClientes();

  const analitica = useMemo(() => {
    const p = pedidos ?? VACIO;
    const stockPorProducto = calcularStockPorProducto(compras ?? VACIO, ventasSocios ?? VACIO, ajustesStock ?? VACIO);
    return {
      resumen: calcularResumenPedidos(p),
      masPedidos: calcularPerfumesMasPedidos(p),
      marcas: calcularMarcasMasPedidas(p),
      evolucion: calcularEvolucionPedidos(p),
      reposicion: calcularOportunidadesReposicion(p, stockPorProducto),
    };
  }, [pedidos, compras, ventasSocios, ajustesStock]);

  const { resumen } = analitica;

  return (
    <div>
      <h1 className="mb-6 font-display text-xl text-text sm:text-2xl">Panel de administración</h1>

      <h2 className="mb-3 font-display text-lg text-text-secondary">Pedidos web</h2>
      {isLoading ? (
        <div className="mb-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard Icon={ShoppingBag} label="Total pedidos" value={resumen.cantidad} />
            <StatCard
              Icon={DollarSign}
              label="Facturación total"
              value={formatARS(resumen.facturado)}
              sub="suma de todos los pedidos"
            />
            <StatCard
              Icon={Receipt}
              label="Ticket promedio"
              value={formatARS(resumen.ticketPromedio)}
              sub="cuánto gasta un cliente por pedido"
            />
            <StatCard
              Icon={Layers}
              label="Unidades por pedido"
              value={resumen.unidadesPorPedido.toFixed(1)}
              sub={`${resumen.unidades} unidades en total`}
            />
          </div>

          <h2 className="mb-3 font-display text-lg text-text-secondary">Qué se vende y qué reponer</h2>
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PerfumesMasPedidos perfumes={analitica.masPedidos} />
            <MarcasMasPedidas marcas={analitica.marcas} />
            <OportunidadesReposicion perfumes={analitica.reposicion} />
            <EvolucionPedidos evolucion={analitica.evolucion} />
          </div>

          <h2 className="mb-1 font-display text-lg text-text-secondary">Qué mira y busca la gente</h2>
          <p className="mb-3 text-xs text-text-secondary">
            Se empezó a registrar a partir de este deploy: los números arrancan de cero y se
            acumulan con el tráfico de ahora en adelante.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PerfumesMasVistos perfumes={interes?.masVistos} />
            <MasBuscados terminos={interes?.masBuscados} />
            <BusquedasSinResultado terminos={interes?.sinResultado} />
            <BajaConversion perfumes={interes?.bajaConversion} />
          </div>
        </>
      )}
    </div>
  );
}
