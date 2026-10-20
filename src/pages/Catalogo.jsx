import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { registrarBusqueda } from '../services/busquedasService';
import { registrarPaso } from '../services/embudoService';
import { Filtros } from '../components/perfumes/Filtros';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { PerfumeGridSkeleton } from '../components/perfumes/PerfumeCardSkeleton';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { abrirAsistente } from '../components/asistente/BotonAsistente';
import { quisoDecir } from '../utils/busqueda';
import { filtrarPerfumes } from '../services/perfumesService';
import { bandasDePrecio, aplicarOrdenYPrecio } from '../utils/ordenCatalogo';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({});
  useEffect(() => { registrarPaso('catalogo'); }, []);
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

  const bandas = useMemo(() => bandasDePrecio(catalogo, dolarMedio), [catalogo, dolarMedio]);
  // Con una corrección clara ("odisse" → "odyssey") se muestran directamente los
  // resultados corregidos, avisando, en vez de pedir un toque extra.
  const perfumesCorregidos = useMemo(
    () => (correccion ? filtrarPerfumes(catalogo, { ...filtros, busqueda: correccion }) : null),
    [correccion, catalogo, filtros]
  );
  const usandoCorreccion = Boolean(perfumesCorregidos?.length);
  const lista = useMemo(
    () => aplicarOrdenYPrecio(usandoCorreccion ? perfumesCorregidos : perfumes, filtros, dolarMedio, bandas),
    [usandoCorreccion, perfumesCorregidos, perfumes, filtros, dolarMedio, bandas]
  );

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display font-light text-3xl tracking-tight text-text sm:text-4xl">Catálogo</h1>
        <p className="font-body text-sm text-text-secondary">
          ¿No sabés cuál elegir?{' '}
          <button
            type="button"
            onClick={abrirAsistente}
            className="inline-flex items-center gap-1.5 font-semibold text-lila transition-base hover:text-text"
          >
            <Sparkles size={14} aria-hidden="true" />
            Encontrá tu perfume
          </button>
        </p>
      </div>
      <Filtros filtros={filtros} onChange={setFiltros} />
      {usandoCorreccion && (
        <p className="mt-4 font-body text-sm text-text-secondary" role="status">
          Mostrando resultados para <span className="font-semibold text-lila">{correccion}</span>
          {' '}(buscaste «{filtros.busqueda}»).
        </p>
      )}
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
              className="gradient-violet rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <PerfumeGrid
            perfumes={lista}
            dolarMedio={dolarMedio}
            onAgregar={agregar}
            vacio={
              <div className="card-surface mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
                <p className="font-body text-text-secondary">
                  {filtros.busqueda
                    ? `No encontramos perfumes para "${filtros.busqueda}".`
                    : 'No encontramos perfumes con esos filtros.'}
                </p>
                {/decan/i.test(filtros.busqueda ?? '') && (
                  <Link to="/decants" className="font-body text-text">
                    Los decants (3, 5 y 10 ml) están en <span className="font-semibold text-lila underline">su propia sección</span>.
                  </Link>
                )}
                {correccion && !usandoCorreccion && (
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
