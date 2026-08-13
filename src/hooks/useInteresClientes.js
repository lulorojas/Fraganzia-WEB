import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarEstadisticas } from '../services/estadisticasService';
import { listarBusquedas } from '../services/busquedasService';
import { usePerfumesAdmin } from './usePerfumesAdmin';

const VACIO = [];

/**
 * Interés de los clientes en el sitio público: qué miran, qué agregan al
 * carrito y qué buscan. Alimenta las tarjetas del dashboard.
 *
 * staleTime alto: son métricas de tendencia, no hace falta releerlas seguido
 * (y cada lectura son ~1 documento por perfume visto).
 */
export function useInteresClientes({ limite = 8 } = {}) {
  const estadisticas = useQuery({
    queryKey: ['estadisticas'],
    queryFn: listarEstadisticas,
    staleTime: 5 * 60 * 1000,
  });

  const busquedas = useQuery({
    queryKey: ['busquedas'],
    queryFn: listarBusquedas,
    staleTime: 5 * 60 * 1000,
  });

  const { data: perfumes } = usePerfumesAdmin();

  const data = useMemo(() => {
    const stats = estadisticas.data ?? VACIO;
    const nombreDe = (id) => perfumes?.find((p) => p.id === id)?.nombre ?? id;

    const conNombre = stats.map((s) => ({
      perfumeId: s.perfumeId,
      nombre: nombreDe(s.perfumeId),
      vistas: s.vistas ?? 0,
      agregados: s.agregadosCarrito ?? 0,
    }));

    const masVistos = [...conNombre].sort((a, b) => b.vistas - a.vistas).slice(0, limite);

    // Miradas que no se convierten: mucho interés, poco carrito. Es la señal
    // para revisar precio, fotos o descripción de ese perfume.
    const bajaConversion = conNombre
      .filter((p) => p.vistas >= 5)
      .map((p) => ({ ...p, conversion: p.vistas ? p.agregados / p.vistas : 0 }))
      .sort((a, b) => a.conversion - b.conversion)
      .slice(0, limite);

    const todasBusquedas = busquedas.data ?? VACIO;
    const masBuscados = [...todasBusquedas]
      .sort((a, b) => (b.conteo ?? 0) - (a.conteo ?? 0))
      .slice(0, limite);
    const sinResultado = todasBusquedas
      .filter((b) => (b.sinResultados ?? 0) > 0)
      .sort((a, b) => (b.sinResultados ?? 0) - (a.sinResultados ?? 0))
      .slice(0, limite);

    return { masVistos, bajaConversion, masBuscados, sinResultado };
  }, [estadisticas.data, busquedas.data, perfumes, limite]);

  return {
    data,
    isLoading: estadisticas.isLoading || busquedas.isLoading,
    error: estadisticas.error ?? busquedas.error ?? null,
  };
}
