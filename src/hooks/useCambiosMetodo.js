import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarCambiosPropios, crearCambio, anularCambio } from '../services/cambiosMetodoService';

// Requiere socioId: el pasaje de dinero es privado de cada socio (regla de Firestore).
export function useCambiosMetodo(socioId) {
  return useQuery({
    queryKey: ['cambiosMetodo', socioId],
    queryFn: () => listarCambiosPropios(socioId),
    enabled: Boolean(socioId),
    staleTime: 60 * 1000,
  });
}

function useInvalidarCambios() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['cambiosMetodo'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearCambioMetodo() {
  const invalidar = useInvalidarCambios();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearCambio(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularCambioMetodo() {
  const invalidar = useInvalidarCambios();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularCambio(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
