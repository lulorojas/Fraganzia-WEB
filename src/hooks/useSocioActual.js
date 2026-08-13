import { useAuth } from '../context/AuthContext';
import { useSocios } from './useSocios';

// Resuelve qué socio corresponde a la cuenta admin logueada, vía el mapeo
// uid -> socio de la colección `socios`. Con fallback al primer socio de la
// lista mientras `socios` está cargando o no hay match (evita romper la UI).
export function useSocioActual() {
  const { user } = useAuth();
  const { data: socios } = useSocios();
  return socios?.find((s) => s.authUid === user?.uid)?.id ?? socios?.[0]?.id ?? 'luciano';
}
