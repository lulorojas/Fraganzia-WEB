import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PerfumeCard } from './PerfumeCard';
import { useConfig } from '../../hooks/useConfig';
import { usePromocionesActivas } from '../../hooks/usePromociones';

const POR_PAGINA = 24;

// Páginas a mostrar: primera, última y las vecinas a la actual; "…" en los saltos.
function paginasVisibles(actual, total) {
  const set = new Set([1, total, actual - 1, actual, actual + 1]);
  const orden = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return orden.flatMap((n, i) => (i > 0 && n - orden[i - 1] > 1 ? ['…', n] : [n]));
}

function Paginador({ pagina, total, onCambiar }) {
  const base =
    'flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-body text-sm transition-base';
  const inactivo = 'border-border text-text-secondary hover:border-violet hover:text-text';
  const deshabilitado = 'disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Páginas del catálogo" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
        className={`${base} ${inactivo} ${deshabilitado}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      {paginasVisibles(pagina, total).map((n, i) =>
        n === '…' ? (
          <span key={`hueco-${i}`} className="px-1 text-text-secondary" aria-hidden="true">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onCambiar(n)}
            aria-label={`Página ${n}`}
            aria-current={n === pagina ? 'page' : undefined}
            className={`${base} ${n === pagina ? 'gradient-violet border-transparent font-semibold text-text' : inactivo}`}
          >
            {n}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === total}
        aria-label="Página siguiente"
        className={`${base} ${inactivo} ${deshabilitado}`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}

/**
 * Muestra el catálogo de a POR_PAGINA perfumes, con paginador abajo. Con ~400
 * perfumes, dibujar todo de una vez generaba más de 7.000 nodos y bloqueaba el
 * celular.
 */
export function PerfumeGrid({ perfumes, dolarMedio, onAgregar, vacio }) {
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();
  const [pagina, setPagina] = useState(1);
  const listaRef = useRef(null);

  // Si cambian los filtros, volver a la primera página.
  useEffect(() => setPagina(1), [perfumes]);

  const total = Math.max(1, Math.ceil((perfumes?.length ?? 0) / POR_PAGINA));
  const actual = Math.min(pagina, total);

  const cambiarPagina = (n) => {
    setPagina(n);
    listaRef.current?.scrollIntoView({ block: 'start' });
  };

  if (!perfumes?.length) return vacio ?? null;

  const desde = (actual - 1) * POR_PAGINA;

  return (
    <>
      <ul
        ref={listaRef}
        className="grid scroll-mt-24 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        aria-label="Perfumes"
      >
        {perfumes.slice(desde, desde + POR_PAGINA).map((perfume, i) => (
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
      {total > 1 && (
        <>
          <Paginador pagina={actual} total={total} onCambiar={cambiarPagina} />
          <p className="mt-3 text-center font-body text-xs text-text-secondary">
            Mostrando {desde + 1}–{Math.min(desde + POR_PAGINA, perfumes.length)} de {perfumes.length} perfumes
          </p>
        </>
      )}
    </>
  );
}
