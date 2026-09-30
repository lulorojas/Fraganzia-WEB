import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarPerfumesPublicos, filtrarPerfumes } from '../services/perfumesService';

// Una sola query para todo el catálogo público; cada pantalla filtra en memoria.
export function usePerfumes(filtros = {}) {
  const query = useQuery({
    queryKey: ['perfumes', 'public'],
    queryFn: listarPerfumesPublicos,
    staleTime: 5 * 60 * 1000,
  });

  const { genero, marca, familiaOlfativa, destacado, busqueda } = filtros;
  const data = useMemo(
    () => filtrarPerfumes(query.data, { genero, marca, familiaOlfativa, destacado, busqueda }),
    [query.data, genero, marca, familiaOlfativa, destacado, busqueda]
  );

  return { ...query, data };
}
