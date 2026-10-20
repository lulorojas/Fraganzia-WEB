export function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-body border border-border text-lila ${className}`}
    >
      {children}
    </span>
  );
}
