import { useQuery } from '@tanstack/react-query';
import { listarVisitas } from '../services/visitasService';

export function useVisitas() {
  return useQuery({ queryKey: ['visitas'], queryFn: listarVisitas, staleTime: 60_000 });
}
