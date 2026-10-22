// Placeholder con las mismas proporciones que PerfumeCard, para que la grilla
// no "salte" cuando llegan los datos (CLS).
export function PerfumeCardSkeleton() {
  return (
    <div className="vitrina flex flex-col overflow-hidden rounded-[22px]" aria-hidden="true">
      <div className="aspect-[4/5] w-full animate-pulse bg-white/[0.05]" />
      <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-2 h-6 w-2/3 animate-pulse rounded bg-white/[0.08]" />
      </div>
    </div>
  );
}

export function PerfumeGridSkeleton({ cantidad = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Cargando perfumes">
      {Array.from({ length: cantidad }, (_, i) => (
        <PerfumeCardSkeleton key={i} />
      ))}
    </div>
  );
}
