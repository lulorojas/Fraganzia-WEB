import { useQuery } from '@tanstack/react-query';
import { obtenerPerfumePorId } from '../services/perfumesService';

export function usePerfume(id) {
  return useQuery({
    queryKey: ['perfume', id],
    queryFn: () => obtenerPerfumePorId(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
