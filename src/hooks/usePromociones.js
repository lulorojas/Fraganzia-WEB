import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAhora } from './useAhora';
import { vigentes } from '../utils/vigencia';
import {
  listarPromocionesActivas,
  listarTodasLasPromociones,
  crearPromocion,
  editarPromocion,
  eliminarPromocion,
} from '../services/promocionesService';

/**
 * Promociones activas Y vigentes. Una promo con fecha de cierre deja de verse y de aplicarse sola al llegar
 * esa hora (el reloj avanza cada 30 s), sin que nadie tenga que apagarla en el admin.
 */
export function usePromocionesActivas() {
  const ahora = useAhora();
  const consulta = useQuery({
    queryKey: ['promociones', 'activas'],
    queryFn: listarPromocionesActivas,
    staleTime: 60 * 1000,
  });
  const data = useMemo(() => (consulta.data ? vigentes(consulta.data, ahora) : consulta.data), [consulta.data, ahora]);
  return { ...consulta, data };
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
