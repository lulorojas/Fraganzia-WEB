import { useConfig, useActualizarConfig } from '../../hooks/useConfig';
import { ConfigForm } from '../../components/admin/ConfigForm';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminConfig() {
  const { data: config, isLoading } = useConfig();
  const { mutateAsync: actualizar, isPending } = useActualizarConfig();

  async function handleSubmit(datos) {
    await actualizar(datos);
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Configuración general</h1>
      {isLoading ? <Spinner /> : (
        <ConfigForm config={config} onSubmit={handleSubmit} cargando={isPending} />
      )}
    </div>
  );
}
