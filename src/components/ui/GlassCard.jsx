export function GlassCard({ className = '', children, ...props }) {
  return (
    <div className={`glass p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
