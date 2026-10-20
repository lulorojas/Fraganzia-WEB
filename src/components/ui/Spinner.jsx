export function Spinner({ className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-border border-t-violet h-6 w-6 ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
