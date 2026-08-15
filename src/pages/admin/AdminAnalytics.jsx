import { useAnalytics } from '../../hooks/useAnalytics';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { AnalyticsRankingPerfumes } from '../../components/admin/AnalyticsRankingPerfumes';
import { AnalyticsDecantsPorTamano } from '../../components/admin/AnalyticsDecantsPorTamano';
import { AnalyticsEvolucionVentas } from '../../components/admin/AnalyticsEvolucionVentas';
import { AnalyticsActividadSocio } from '../../components/admin/AnalyticsActividadSocio';
import {
  AnalyticsGananciaMensual, AnalyticsMargen, AnalyticsGananciaPorCompra,
} from '../../components/admin/AnalyticsGanancia';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();
  const { data: socios } = useSocios();
  const { data: perfumes } = usePerfumesAdmin();

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Cuánto ganamos</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnalyticsGananciaMensual evolucion={data?.evolucionGanancia} />
          <div className="flex flex-col gap-6">
            <AnalyticsMargen ganancia={data?.ganancia} />
            <AnalyticsGananciaPorCompra ganancia={data?.ganancia} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">
          Cuánto vendimos
        </h2>
        <p className="mb-3 text-xs text-text-secondary">
          Facturación pura, sin descontar costos ni gastos: cuánto stock estamos moviendo mes a mes.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnalyticsEvolucionVentas evolucion={data?.evolucionVentas} ingresoTotal={data?.ingresoTotal} />
          <AnalyticsRankingPerfumes ranking={data?.rankingPerfumes} />
          <AnalyticsDecantsPorTamano ventasDecants={data?.ventasDecants} perfumes={perfumes} />
          <AnalyticsActividadSocio actividad={data?.actividadPorSocio} socios={socios} />
        </div>
      </section>
    </div>
  );
}
