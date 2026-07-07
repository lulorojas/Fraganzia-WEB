import { useQuery } from '@tanstack/react-query';
import { listarPerfumesPublicos } from '../services/perfumesService';

export function usePerfumes(filtros = {}) {
  return useQuery({
    queryKey: ['perfumes', filtros],
    queryFn: () => listarPerfumesPublicos(filtros),
    staleTime: 60 * 1000,
  });
}
