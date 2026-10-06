import { useQuery } from '@tanstack/react-query';
import { listarBotProveedorLog } from '../services/botProveedorService';

export function useBotProveedorLog() {
  return useQuery({
    queryKey: ['botProveedorLog'],
    queryFn: () => listarBotProveedorLog(),
    staleTime: 60 * 1000,
  });
}
