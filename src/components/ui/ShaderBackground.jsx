// Fondo decorativo de orbes violetas: solo gradientes radiales estáticos.
// Historia: primero fue WebGL con un loop infinito (bloqueaba el hilo principal)
// y después orbes CSS animados con `filter: blur(64px)`, que obligaban a
// repintar tres capas gigantes difuminadas en cada frame, y con ellas todo lo
// que tuviera backdrop-filter encima. Los gradientes radiales ya son difusos
// por sí mismos, así que el look es el mismo con costo de pintado casi cero.
export function ShaderBackground({ className = '', opacity = 0.6 }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 bg-bg ${className}`}
      style={{
        opacity,
        // El primero va arriba: el velo oscuro atenúa los orbes hacia abajo.
        backgroundImage: [
          'linear-gradient(180deg, rgba(6,4,13,0.2) 0%, rgba(6,4,13,0.8) 50%, #06040D 100%)',
          'radial-gradient(circle at 15% 10%, rgba(123,47,190,0.35) 0%, rgba(123,47,190,0) 45%)',
          'radial-gradient(circle at 90% 20%, rgba(192,132,252,0.22) 0%, rgba(192,132,252,0) 40%)',
          'radial-gradient(circle at 55% 95%, rgba(155,89,208,0.28) 0%, rgba(155,89,208,0) 45%)',
        ].join(', '),
      }}
    />
  );
}
