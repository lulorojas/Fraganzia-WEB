// Fondo decorativo de orbes violetas, implementado con CSS puro (radial
// gradients + animaciones por transform). Antes usaba WebGL con un loop de
// requestAnimationFrame corriendo para siempre en TODA la app, lo que en
// entornos sin aceleración por GPU (como el Chrome headless de Lighthouse)
// causaba un Total Blocking Time enorme. Las animaciones CSS por `transform`
// corren en el compositor, no en el hilo principal de JS.
export function ShaderBackground({ className = '', opacity = 0.6 }) {
  return (
    <div className={`fixed inset-0 z-0 overflow-hidden bg-bg ${className}`} style={{ opacity }}>
      <div
        className="absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] animate-orb-1 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(123,47,190,0.35) 0%, rgba(123,47,190,0) 70%)' }}
      />
      <div
        className="absolute -right-1/4 top-0 h-[60vmax] w-[60vmax] animate-orb-2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.25) 0%, rgba(192,132,252,0) 70%)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[65vmax] w-[65vmax] animate-orb-3 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(155,89,208,0.3) 0%, rgba(155,89,208,0) 70%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/80 to-bg pointer-events-none" />
    </div>
  );
}
