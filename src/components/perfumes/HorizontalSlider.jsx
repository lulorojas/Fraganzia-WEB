import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PerfumeCard } from './PerfumeCard';

// Con decenas de destacados, dibujarlos todos encarece el primer pintado: se muestran los primeros y el resto está en el catálogo.
const MAX_VISIBLES = 16;

/** Fila horizontal de cards (la misma card del catálogo), con botones laterales en pantallas grandes. */
export function HorizontalSlider({ perfumes, dolarMedio, onAgregar, promociones, etiqueta = 'Perfumes destacados' }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  if (!perfumes?.length) return null;

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="glass-frosted absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-3 opacity-0 transition-opacity duration-300 hover:bg-violet/20 focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
        aria-label="Ver perfumes anteriores"
      >
        <ChevronLeft size={20} className="text-text" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        className="glass-frosted absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-3 opacity-0 transition-opacity duration-300 hover:bg-violet/20 focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
        aria-label="Ver más perfumes"
      >
        <ChevronRight size={20} className="text-text" aria-hidden="true" />
      </button>

      <ul
        ref={scrollRef}
        className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0"
        aria-label={etiqueta}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        {perfumes.slice(0, MAX_VISIBLES).map((perfume, i) => (
          <li key={perfume.id} className="flex w-[232px] flex-none snap-start sm:w-[264px]">
            <PerfumeCard perfume={perfume} dolarMedio={dolarMedio} onAgregar={onAgregar} promociones={promociones} prioridad={i < 2} />
          </li>
        ))}
        {perfumes.length > MAX_VISIBLES && (
          <li className="flex w-[232px] flex-none snap-start sm:w-[264px]">
            <Link
              to="/catalogo"
              className="vitrina flex w-full flex-col items-center justify-center gap-3 rounded-[22px] p-6 text-center"
            >
              <span className="font-display text-xl font-light text-text">Ver todo el catálogo</span>
              <span className="font-body text-sm text-text-secondary">
                Hay {perfumes.length - MAX_VISIBLES} más y el resto de la colección
              </span>
              <ChevronRight size={22} className="text-lila" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
