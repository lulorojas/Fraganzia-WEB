import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { preciosPorMetodo } from '../../utils/precios';
import { formatARS, nombreCompleto } from '../../utils/format';
import { ImagenProducto } from './ImagenProducto';
import { BotonFavorito } from './BotonFavorito';

export function HorizontalSlider({ perfumes, dolarMedio, onAgregar }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!perfumes?.length) return null;

  return (
    <div className="relative group">
      {/* Navigation buttons */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex glass-frosted p-3 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 hover:bg-violet/20"
        aria-label="Ver perfumes anteriores"
      >
        <ChevronLeft size={20} className="text-text" />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex glass-frosted p-3 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 hover:bg-violet/20"
        aria-label="Ver más perfumes"
      >
        <ChevronRight size={20} className="text-text" />
      </button>

      {/* Slider container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 hide-scrollbar"
        role="region"
        aria-label="Perfumes destacados"
        tabIndex={0}
      >
        {perfumes.map((perfume) => {
          const precios = dolarMedio ? preciosPorMetodo(perfume.precioUSD, dolarMedio) : null;
          
          return (
            <div
              key={perfume.id}
              className="flex-none w-[280px] snap-start group/card"
            >
              <div className="card-surface card-hover relative h-full rounded-2xl overflow-hidden">
                <BotonFavorito perfume={perfume} className="absolute left-3 top-3 z-10" />
                <Link to={`/perfume/${perfume.id}`} className="block" tabIndex={-1} aria-hidden="true">
                  <div className="relative aspect-[3/4] bg-white overflow-hidden">
                    <ImagenProducto
                      url={perfume.imagenes?.[0]}
                      sizes="280px"
                      width="280"
                      height="373"
                      className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover/card:scale-110"
                    />
                    {perfume.descuento > 0 && (
                      <div className="absolute top-3 right-3 bg-violet px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg">
                        -{perfume.descuento}%
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <p className="text-xs font-medium text-lila uppercase tracking-wide2 mb-1">
                    {perfume.marca}
                  </p>
                  <h3 className="font-display font-semibold text-text mb-3 line-clamp-2">
                    <Link to={`/perfume/${perfume.id}`} className="hover:text-lila transition-base">
                      {perfume.nombre}
                    </Link>
                  </h3>

                  <div className="h-px bg-gradient-to-r from-violet/20 via-violet/50 to-violet/20 mb-3" />

                  {precios ? (
                    <div className="space-y-1 text-sm mb-4 tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Transferencia</span>
                        <span className="text-text font-medium">{formatARS(precios.precioTransferencia)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Efectivo</span>
                        <span className="text-text font-medium">{formatARS(precios.precioEfectivo)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 text-sm text-text-secondary">Precio no disponible</div>
                  )}

                  <button
                    type="button"
                    onClick={() => onAgregar(perfume)}
                    aria-label={`Agregar ${nombreCompleto(perfume)} al carrito`}
                    className="w-full py-2.5 px-4 bg-violet/10 hover:bg-violet text-text rounded-xl font-medium text-sm transition-colors duration-300 border border-violet/30 hover:border-violet"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
