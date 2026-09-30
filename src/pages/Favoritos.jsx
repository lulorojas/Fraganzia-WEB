import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { useFavoritos } from '../context/FavoritosContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { PerfumeGridSkeleton } from '../components/perfumes/PerfumeCardSkeleton';
import { abrirAsistente } from '../components/asistente/BotonAsistente';

export default function Favoritos() {
  useDocumentMeta({ title: 'Mis favoritos', path: '/favoritos' });
  const { ids, quitar } = useFavoritos();
  const { data: catalogo, isLoading } = usePerfumes();
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();

  // En el orden en que se guardaron (el más reciente primero).
  const { perfumes, noDisponibles } = useMemo(() => {
    const porId = new Map((catalogo ?? []).map((p) => [p.id, p]));
    return {
      perfumes: ids.map((id) => porId.get(id)).filter(Boolean),
      noDisponibles: catalogo ? ids.filter((id) => !porId.has(id)) : [],
    };
  }, [catalogo, ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="tracking-luxury mb-2 font-body text-xs uppercase text-lila">Tu selección</p>
        <h1 className="font-display text-3xl text-text">Mis favoritos</h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Se guardan en este dispositivo. No hace falta crear una cuenta.
        </p>
      </div>

      {noDisponibles.length > 0 && (
        <div className="card-surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="font-body text-sm text-text-secondary">
            {noDisponibles.length === 1
              ? '1 perfume que guardaste ya no está disponible.'
              : `${noDisponibles.length} perfumes que guardaste ya no están disponibles.`}
          </p>
          <button
            type="button"
            onClick={() => quitar(noDisponibles)}
            className="rounded-lg px-3 py-1.5 font-body text-sm text-lila transition-colors hover:text-text"
          >
            Quitarlos de la lista
          </button>
        </div>
      )}

      {isLoading && ids.length > 0 ? (
        <PerfumeGridSkeleton cantidad={Math.min(ids.length, 8)} />
      ) : (
        <PerfumeGrid
          perfumes={perfumes}
          dolarMedio={dolarMedio}
          onAgregar={agregar}
          vacio={
            <div className="card-surface mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
              <Heart size={32} className="text-lila" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl text-text">Todavía no guardaste perfumes</h2>
                <p className="mt-2 font-body text-sm text-text-secondary">
                  Tocá el corazón de cualquier perfume para guardarlo acá y compararlo después.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/catalogo"
                  className="gradient-violet rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-text"
                >
                  Ver catálogo
                </Link>
                <button
                  type="button"
                  onClick={abrirAsistente}
                  className="flex items-center gap-1.5 rounded-xl border border-violet/30 px-5 py-2.5 font-body text-sm font-semibold text-text transition-colors hover:border-violet"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Que me recomienden
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
