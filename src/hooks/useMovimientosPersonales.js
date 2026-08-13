import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarMovimientosPropios, crearMovimiento, editarMovimiento, anularMovimiento,
} from '../services/movimientosPersonalesService';

// Requiere socioId: la colección es privada por socio (regla de Firestore),
// no existe una lectura "de todos" posible.
export function useMovimientosPersonales(socioId) {
  return useQuery({
    queryKey: ['movimientosPersonales', socioId],
    queryFn: () => listarMovimientosPropios(socioId),
    enabled: Boolean(socioId),
    staleTime: 60 * 1000,
  });
}

function useInvalidarMovimientosPersonales() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['movimientosPersonales'] });
    qc.invalidateQueries({ queryKey: ['panelFinanciero'] });
  };
}

export function useCrearMovimientoPersonal() {
  const invalidar = useInvalidarMovimientosPersonales();
  return useMutation({
    mutationFn: ({ datos, socioId }) => crearMovimiento(datos, socioId),
    onSuccess: invalidar,
  });
}

export function useEditarMovimientoPersonal() {
  const invalidar = useInvalidarMovimientosPersonales();
  return useMutation({
    mutationFn: ({ id, datosNuevos, valorAnterior, socioId }) => editarMovimiento(id, datosNuevos, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}

export function useAnularMovimientoPersonal() {
  const invalidar = useInvalidarMovimientosPersonales();
  return useMutation({
    mutationFn: ({ id, valorAnterior, socioId }) => anularMovimiento(id, valorAnterior, socioId),
    onSuccess: invalidar,
  });
}
