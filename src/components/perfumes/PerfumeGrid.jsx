import { PerfumeCard } from './PerfumeCard';

export function PerfumeGrid({ perfumes, dolarMedio, onAgregar }) {
  if (!perfumes?.length) {
    return <p className="text-text-secondary">No hay perfumes que coincidan con la búsqueda.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {perfumes.map((perfume) => (
        <PerfumeCard
          key={perfume.id}
          perfume={perfume}
          dolarMedio={dolarMedio}
          onAgregar={onAgregar}
        />
      ))}
    </div>
  );
}
