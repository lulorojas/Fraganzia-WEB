import { useQuery } from '@tanstack/react-query';
import { listarTodosLosPerfumes } from '../services/perfumesService';

// Catálogo completo para los selectores del panel. Con staleTime propio para no
// releer la colección en cada montaje de formulario ni en cada foco de ventana.
export function usePerfumesAdmin() {
  return useQuery({
    queryKey: ['perfumes', 'admin'],
    queryFn: listarTodosLosPerfumes,
    staleTime: 5 * 60 * 1000,
  });
}
