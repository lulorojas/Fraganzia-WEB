import { usePanelFinanciero } from '../../hooks/usePanelFinanciero';
import { useSocios } from '../../hooks/useSocios';
import { useSocioActual } from '../../hooks/useSocioActual';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { TotalesSocioCard } from '../../components/admin/panel/TotalesSocioCard';
import { SaldoNetoCard } from '../../components/admin/panel/SaldoNetoCard';
import { StockCard } from '../../components/admin/panel/StockCard';
import { MovimientosRecientesList } from '../../components/admin/panel/MovimientosRecientesList';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminFinanzasResumen() {
  const { data: panel, isLoading } = usePanelFinanciero();
  const { data: socios } = useSocios();
  const socioActualId = useSocioActual();
  const { data: perfumes } = usePerfumesAdmin();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TotalesSocioCard socioActualId={socioActualId} socios={socios} totalesPorSocio={panel?.totalesPorSocio} />
      <SaldoNetoCard saldoNeto={panel?.saldoNeto ?? 0} socios={socios} />
      <StockCard stockPorProducto={panel?.stockPorProducto} perfumes={perfumes} />
      <MovimientosRecientesList movimientos={panel?.movimientosRecientes} />
    </div>
  );
}
