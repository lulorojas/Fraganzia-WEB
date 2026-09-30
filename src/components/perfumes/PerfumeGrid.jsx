import { useEffect, useRef, useState } from 'react';
import { PerfumeCard } from './PerfumeCard';
import { useConfig } from '../../hooks/useConfig';
import { usePromocionesActivas } from '../../hooks/usePromociones';

const POR_PAGINA = 24;

/**
 * Renderiza de a POR_PAGINA perfumes y agrega más al acercarse al final (o con
 * el botón, para teclado y lectores de pantalla). Con ~400 perfumes, dibujar
 * todo de una vez generaba más de 7.000 nodos y bloqueaba el celular.
 */
export function PerfumeGrid({ perfumes, dolarMedio, onAgregar, vacio }) {
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const sentinelaRef = useRef(null);

  // Si cambian los filtros, volver a la primera página.
  useEffect(() => setVisibles(POR_PAGINA), [perfumes]);

  const hayMas = (perfumes?.length ?? 0) > visibles;

  useEffect(() => {
    if (!hayMas || !sentinelaRef.current || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      ([entrada]) => entrada.isIntersecting && setVisibles((v) => v + POR_PAGINA),
      { rootMargin: '600px 0px' }
    );
    observer.observe(sentinelaRef.current);
    return () => observer.disconnect();
  }, [hayMas, visibles]);

  if (!perfumes?.length) return vacio ?? null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label="Perfumes">
        {perfumes.slice(0, visibles).map((perfume, i) => (
          <li key={perfume.id} className="flex">
            <PerfumeCard
              perfume={perfume}
              dolarMedio={dolarMedio}
              onAgregar={onAgregar}
              config={config}
              promociones={promociones}
              prioridad={i < 4}
            />
          </li>
        ))}
      </ul>
      {hayMas && (
        <div ref={sentinelaRef} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibles((v) => v + POR_PAGINA)}
            className="rounded-xl border border-violet/30 px-6 py-3 font-body text-sm font-semibold text-text transition-base hover:border-violet hover:bg-violet/20"
          >
            Ver más perfumes ({perfumes.length - visibles} restantes)
          </button>
        </div>
      )}
    </>
  );
}
