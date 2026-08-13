import { useEffect, useState } from 'react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { incrementarAgregadoCarrito } from '../services/estadisticasService';
import { registrarBusqueda } from '../services/busquedasService';
import { Filtros } from '../components/perfumes/Filtros';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { Spinner } from '../components/ui/Spinner';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({});
  const { data: perfumes, isLoading } = usePerfumes(filtros);
  const { dolarMedio } = useDolarBlue();
  const { dispatch } = useCart();

  const busqueda = filtros.busqueda ?? '';

  // Registra el término recién cuando el usuario deja de tipear (800 ms), no en
  // cada tecla. Espera a que la query termine para saber si hubo resultados —
  // las búsquedas sin resultado son el dato más útil: lo que la gente quiere y
  // no tenemos.
  useEffect(() => {
    if (!busqueda.trim() || isLoading) return undefined;
    const timer = setTimeout(() => {
      registrarBusqueda(busqueda, (perfumes?.length ?? 0) > 0);
    }, 800);
    return () => clearTimeout(timer);
  }, [busqueda, isLoading, perfumes]);

  function handleAgregar(perfume) {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        perfumeId: perfume.id,
        nombre: perfume.nombre,
        marca: perfume.marca,
        precioUSD: perfume.precioUSD,
        cantidad: 1,
      },
    });
    incrementarAgregadoCarrito(perfume.id);
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 font-display text-xl text-text sm:text-2xl">Catálogo</h1>
      <Filtros filtros={filtros} onChange={setFiltros} />
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : (
          <PerfumeGrid perfumes={perfumes} dolarMedio={dolarMedio} onAgregar={handleAgregar} />
        )}
      </div>
    </div>
  );
}
