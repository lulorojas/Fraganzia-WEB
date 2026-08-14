import { useConfig, useActualizarConfig } from '../../hooks/useConfig';
import { ConfigForm } from '../../components/admin/ConfigForm';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminConfig() {
  const { data: config, isLoading } = useConfig();
  const { mutateAsync: actualizar, isPending } = useActualizarConfig();

  async function handleSubmit(datos) {
    await actualizar(datos);
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-xl text-text sm:text-2xl">Configuración general</h1>
      {isLoading ? <Spinner /> : (
        <GlassCard className="max-w-md p-6">
          <ConfigForm config={config} onSubmit={handleSubmit} cargando={isPending} />
        </GlassCard>
      )}
    </div>
  );
}
