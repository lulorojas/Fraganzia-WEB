import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { obtenerConfig, actualizarConfig } from '../services/configService';

export function useConfig() {
  return useQuery({
    queryKey: ['config', 'general'],
    queryFn: obtenerConfig,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActualizarConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actualizarConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'general'] }),
  });
}
