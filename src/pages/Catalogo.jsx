import { useState } from 'react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { Filtros } from '../components/perfumes/Filtros';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { Spinner } from '../components/ui/Spinner';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({});
  const { data: perfumes, isLoading } = usePerfumes(filtros);
  const { dolarMedio } = useDolarBlue();
  const { dispatch } = useCart();

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
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 font-display text-2xl text-text">Catálogo</h1>
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
