/**
 * Logo de Fraganzia: solo el nombre, en trazo fino y muy espaciado, con un hilo de luz debajo (propuesta A,
 * elegida el 17/11/2026). Sin símbolo: se lee igual en cualquier tamaño y no hay un dibujo que envejezca.
 * El nombre es texto real (lo leen buscadores, lectores de pantalla y agentes de IA).
 *
 * El tamaño sale de la variable CSS `--logo-scale` (1 = nombre de 22px), así se puede cambiar por
 * breakpoint con una sola pieza, por ejemplo className="[--logo-scale:0.85] lg:[--logo-scale:1.15]".
 * `size` fija la escala inicial cuando no se pasa por className.
 * `subtitulo` agrega "Perfumes árabes" debajo: true = siempre, 'sm' = solo desde tableta (en el celular no entra).
 */
export function LogoFraganzia({ size = 1, className = '', subtitulo = false }) {
  const e = 'var(--logo-scale, 1)';
  return (
    <div
      className={`inline-flex select-none flex-col items-stretch ${className}`}
      style={{ lineHeight: 1, ...(className.includes('--logo-scale') ? {} : { '--logo-scale': size }) }}
    >
      <span
        className="font-display text-center text-text"
        style={{ fontWeight: 300, fontSize: `calc(22px * ${e})`, letterSpacing: '0.34em', marginRight: '-0.34em' }}
      >
        FRAGANZIA
      </span>
      {' '}
      <span
        aria-hidden="true"
        className="block"
        style={{ height: 1, margin: `calc(9px * ${e}) 0 calc(${subtitulo ? 8 : 0}px * ${e})`, background: 'linear-gradient(90deg, transparent, #C084FC, transparent)' }}
      />
      {subtitulo && ' '}
      {subtitulo && (
        <span
          className={`font-display text-center font-normal uppercase text-lila ${subtitulo === 'sm' ? 'hidden sm:block' : ''}`}
          style={{ fontSize: `calc(8.5px * ${e})`, letterSpacing: '0.5em', marginRight: '-0.5em' }}
        >
          Perfumes árabes
        </span>
      )}
    </div>
  );
}
