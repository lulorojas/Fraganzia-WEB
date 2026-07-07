import { useQuery } from '@tanstack/react-query';
import { DOLAR_BLUE_API } from '../constants';
import { valorDolarMedio } from '../utils/precios';
import { useConfig } from './useConfig';

async function fetchDolarBlue() {
  const res = await fetch(DOLAR_BLUE_API);
  if (!res.ok) throw new Error('No se pudo obtener la cotización del dólar blue');
  return res.json();
}

export function useDolarBlue() {
  const { data: config, isLoading: cargandoConfig } = useConfig();

  const { data: dolar, isError, isLoading: cargandoDolar } = useQuery({
    queryKey: ['dolarBlue'],
    queryFn: fetchDolarBlue,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const cargando = cargandoDolar || cargandoConfig;

  if (!isError && dolar) {
    return { dolarMedio: valorDolarMedio(dolar), esFallback: false, cargando };
  }

  const fallback = config?.dolarBlueManual;
  if (fallback) {
    return { dolarMedio: fallback, esFallback: true, cargando };
  }

  return { dolarMedio: null, esFallback: true, cargando };
}
