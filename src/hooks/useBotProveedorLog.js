import { useQuery } from '@tanstack/react-query';
import { listarBotProveedorLog, leerEstadoBotProveedor } from '../services/botProveedorService';

export function useBotProveedorLog() {
  return useQuery({
    queryKey: ['botProveedorLog'],
    queryFn: () => listarBotProveedorLog(),
    staleTime: 60 * 1000,
  });
}

export function useEstadoBotProveedor() {
  return useQuery({
    queryKey: ['botProveedorEstado'],
    queryFn: leerEstadoBotProveedor,
    staleTime: 60 * 1000,
  });
}
