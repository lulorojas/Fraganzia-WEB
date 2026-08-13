import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarAuditoria, filtrarAuditoria } from '../services/auditoriaService';
import { useSocioActual } from './useSocioActual';

// La lectura no depende de los filtros: se traen las entradas una sola vez y el
// filtrado ocurre en memoria. Poner los filtros en el queryKey haría que cada
// cambio de filtro releyera todo desde Firestore.
export function useAuditoria(filtros = {}) {
  const socioActualId = useSocioActual();

  const query = useQuery({
    queryKey: ['auditoria', socioActualId],
    queryFn: () => listarAuditoria(socioActualId),
    enabled: Boolean(socioActualId),
    staleTime: 60 * 1000,
  });

  const data = useMemo(
    () => filtrarAuditoria(query.data ?? [], filtros),
    [query.data, filtros.coleccion, filtros.socioId, filtros.desde, filtros.hasta]
  );

  return { ...query, data };
}
