import { useQuery, useQueryClient } from '@tanstack/react-query';
import { obtenerPerfumePorId } from '../services/perfumesService';

export function usePerfume(id) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ['perfume', id],
    queryFn: () => obtenerPerfumePorId(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    // Si el visitante viene del catálogo o de la home, el perfume ya está en
    // la caché del listado: se muestra al instante, sin esperar ni leer de nuevo.
    initialData: () => qc.getQueryData(['perfumes', 'public'])?.find((p) => p.id === id),
    initialDataUpdatedAt: () => qc.getQueryState(['perfumes', 'public'])?.dataUpdatedAt,
  });
}
