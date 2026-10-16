// Fondo decorativo de orbes violetas: solo gradientes radiales estáticos.
// Historia: primero fue WebGL con un loop infinito (bloqueaba el hilo principal)
// y después orbes CSS animados con `filter: blur(64px)`, que obligaban a
// repintar tres capas gigantes difuminadas en cada frame, y con ellas todo lo
// que tuviera backdrop-filter encima. Los gradientes radiales ya son difusos
// por sí mismos, así que el look es el mismo con costo de pintado casi cero.
export function ShaderBackground({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`shader-bg pointer-events-none fixed inset-0 z-0 bg-bg opacity-50 ${className}`}
      // Nada de `style` inline: cualquier valor ahí (gradientes, colores hex,
      // incluso un simple opacity) sale re-serializado distinto por el
      // navegador al capturar el HTML pre-renderizado (ej. "opacity: 0.5;"
      // vs el "opacity:0.5" que genera React), y React lo marca como
      // mismatch al hidratar. Todo el look va por clases CSS fijas.
    />
  );
}
