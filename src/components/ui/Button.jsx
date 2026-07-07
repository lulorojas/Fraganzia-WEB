const VARIANTS = {
  primary: 'gradient-violet text-text',
  secondary: 'glass text-text hover:glow',
  ghost: 'bg-transparent text-text-secondary hover:text-text',
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-body font-medium transition-base disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
