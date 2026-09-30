import { useEffect, useState } from 'react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { registrarBusqueda } from '../services/busquedasService';
import { Filtros } from '../components/perfumes/Filtros';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { PerfumeGridSkeleton } from '../components/perfumes/PerfumeCardSkeleton';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({});
  const { data: perfumes, isLoading, isError, refetch } = usePerfumes(filtros);
  useDocumentMeta({
    title: 'Catálogo de perfumes árabes',
    description:
      'Todos nuestros perfumes árabes originales: Lattafa, Armaf, Al Haramain y más. Filtrá por género, marca y familia olfativa.',
    path: '/catalogo',
  });
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();

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


  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="tracking-luxury mb-2 font-body text-xs uppercase text-lila">Colección completa</p>
        <h1 className="font-display text-3xl text-text">Catálogo</h1>
      </div>
      <Filtros filtros={filtros} onChange={setFiltros} />
      <div className="mt-6">
        {isLoading ? (
          <PerfumeGridSkeleton />
        ) : isError ? (
          <div className="card-surface mx-auto max-w-md rounded-2xl p-8 text-center" role="alert">
            <p className="mb-4 font-body text-text-secondary">
              No pudimos cargar el catálogo. Revisá tu conexión y probá de nuevo.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="gradient-violet rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-text"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <PerfumeGrid
            perfumes={perfumes}
            dolarMedio={dolarMedio}
            onAgregar={agregar}
            vacio={
              <div className="card-surface mx-auto max-w-md rounded-2xl p-8 text-center">
                <p className="mb-4 font-body text-text-secondary">
                  No encontramos perfumes con esos filtros.
                </p>
                <button
                  type="button"
                  onClick={() => setFiltros({})}
                  className="rounded-xl border border-violet/30 px-5 py-2.5 font-body text-sm font-semibold text-text transition-base hover:border-violet hover:bg-violet/20"
                >
                  Limpiar filtros
                </button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
