import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarAuditoria, filtrarAuditoria } from '../services/auditoriaService';

// La lectura no depende de los filtros: se trae la colección una sola vez y el
// filtrado ocurre en memoria. Poner los filtros en el queryKey haría que cada
// cambio de filtro releyera toda la colección desde Firestore.
export function useAuditoria(filtros = {}) {
  const query = useQuery({
    queryKey: ['auditoria'],
    queryFn: listarAuditoria,
    staleTime: 60 * 1000,
  });

  const data = useMemo(
    () => filtrarAuditoria(query.data ?? [], filtros),
    [query.data, filtros.coleccion, filtros.socioId, filtros.desde, filtros.hasta]
  );

  return { ...query, data };
}
