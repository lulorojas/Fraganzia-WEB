import { useAnalytics } from '../../hooks/useAnalytics';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { AnalyticsRankingPerfumes } from '../../components/admin/AnalyticsRankingPerfumes';
import { AnalyticsDecantsPorTamano } from '../../components/admin/AnalyticsDecantsPorTamano';
import { AnalyticsEvolucionVentas } from '../../components/admin/AnalyticsEvolucionVentas';
import { AnalyticsActividadSocio } from '../../components/admin/AnalyticsActividadSocio';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();
  const { data: socios } = useSocios();
  const { data: perfumes } = usePerfumesAdmin();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Analytics</h1>
      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnalyticsRankingPerfumes ranking={data?.rankingPerfumes} />
          <AnalyticsDecantsPorTamano ventasDecants={data?.ventasDecants} perfumes={perfumes} />
          <AnalyticsEvolucionVentas evolucion={data?.evolucionVentas} ingresoTotal={data?.ingresoTotal} />
          <AnalyticsActividadSocio actividad={data?.actividadPorSocio} socios={socios} />
        </div>
      )}
    </div>
  );
}
