import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarPromocionesActivas,
  listarTodasLasPromociones,
  crearPromocion,
  editarPromocion,
  eliminarPromocion,
} from '../services/promocionesService';

export function usePromocionesActivas() {
  return useQuery({
    queryKey: ['promociones', 'activas'],
    queryFn: listarPromocionesActivas,
    staleTime: 60 * 1000,
  });
}

export function useTodasLasPromociones() {
  return useQuery({
    queryKey: ['promociones', 'todas'],
    queryFn: listarTodasLasPromociones,
    staleTime: 30 * 1000,
  });
}

function useInvalidarPromociones() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['promociones'] });
}

export function useCrearPromocion() {
  const invalidar = useInvalidarPromociones();
  return useMutation({ mutationFn: crearPromocion, onSuccess: invalidar });
}

export function useEditarPromocion() {
  const invalidar = useInvalidarPromociones();
  return useMutation({
    mutationFn: ({ id, datos }) => editarPromocion(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarPromocion() {
  const invalidar = useInvalidarPromociones();
  return useMutation({ mutationFn: eliminarPromocion, onSuccess: invalidar });
}
