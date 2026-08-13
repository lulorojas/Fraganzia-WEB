import { useQuery } from '@tanstack/react-query';
import { listarSocios } from '../services/sociosService';

export function useSocios() {
  return useQuery({
    queryKey: ['socios'],
    queryFn: listarSocios,
    staleTime: 5 * 60 * 1000,
  });
}
