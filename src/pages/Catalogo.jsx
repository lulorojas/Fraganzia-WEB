import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { registrarBusqueda } from '../services/busquedasService';
import { Filtros } from '../components/perfumes/Filtros';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { PerfumeGridSkeleton } from '../components/perfumes/PerfumeCardSkeleton';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { abrirAsistente } from '../components/asistente/BotonAsistente';
import { quisoDecir } from '../utils/busqueda';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({});
  const { data: perfumes, isLoading, isError, refetch } = usePerfumes(filtros);
  const { data: catalogo } = usePerfumes();

  // Búsqueda sin resultados: proponer la corrección más probable ("latafa" →
  // "lattafa"), buscando en todo el catálogo para no depender de los filtros.
  const correccion = useMemo(
    () => (filtros.busqueda && perfumes?.length === 0 ? quisoDecir(catalogo, filtros.busqueda) : null),
    [filtros.busqueda, perfumes, catalogo]
  );
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
        <h1 className="font-luxury text-3xl tracking-wide text-text sm:text-4xl">Catálogo</h1>
      </div>
      <div className="card-surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5">
        <p className="font-body text-sm text-text-secondary">
          <span className="text-text">¿No sabés cuál elegir?</span> Respondé unas preguntas y te recomendamos el ideal.
        </p>
        <button
          type="button"
          onClick={abrirAsistente}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-violet-light px-4 py-2.5 font-body text-sm font-semibold text-white shadow-md shadow-violet/30 transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles size={16} aria-hidden="true" />
          Encontrá tu perfume
        </button>
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
              <div className="card-surface mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
                <p className="font-body text-text-secondary">
                  {filtros.busqueda
                    ? `No encontramos perfumes para "${filtros.busqueda}".`
                    : 'No encontramos perfumes con esos filtros.'}
                </p>
                {correccion && (
                  <button
                    type="button"
                    onClick={() => setFiltros({ busqueda: correccion })}
                    className="font-body text-text"
                  >
                    ¿Quisiste decir <span className="font-semibold text-lila underline">{correccion}</span>?
                  </button>
                )}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltros({})}
                    className="rounded-xl border border-violet/30 px-5 py-2.5 font-body text-sm font-semibold text-text transition-base hover:border-violet hover:bg-violet/20"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    type="button"
                    onClick={abrirAsistente}
                    className="rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-lila transition-base hover:text-text"
                  >
                    Pedir una recomendación
                  </button>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
