import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { actualizarPerfumesPublicos, filtrarPerfumes } from '../services/perfumesService';

// Una sola query para todo el catálogo público; cada pantalla filtra en memoria.
const KEY = ['perfumes', 'public'];

export function usePerfumes(filtros = {}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    // Con la foto del build (o la lectura anterior) solo se piden los perfumes
    // que cambiaron desde entonces; sin ella, el catálogo completo.
    queryFn: () => actualizarPerfumesPublicos(qc.getQueryData(KEY), qc.getQueryState(KEY)?.dataUpdatedAt),
    staleTime: 5 * 60 * 1000,
  });

  const { genero, marca, familiaOlfativa, destacado, busqueda } = filtros;
  const data = useMemo(
    () => filtrarPerfumes(query.data, { genero, marca, familiaOlfativa, destacado, busqueda }),
    [query.data, genero, marca, familiaOlfativa, destacado, busqueda]
  );

  return { ...query, data };
}
