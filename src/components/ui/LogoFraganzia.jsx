import { useId } from 'react';

/**
 * Símbolo: un frasco de perfume cuyos hombros son un arco (la arquitectura de la
 * perfumería oriental) y una F adentro. Lila en degradé, sin serifas.
 * `simple` engrosa la línea para que aguante tamaños chicos.
 */
export function MarcaFraganzia({ className = '', simple = false, style }) {
  const id = useId();
  const grad = `grad-${id.replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 76" fill="none" aria-hidden="true" className={className} style={style}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D5FF" />
          <stop offset=".5" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7B2FBE" />
        </linearGradient>
      </defs>
      <rect x="25.5" y="3" width="13" height="7" rx="1.4" fill={`url(#${grad})`} />
      <path
        d="M27.5 10H36.5V14.5C37 18 41 19.5 45.5 23C52 28 56 33 56 41V72H8V41C8 33 12 28 18.5 23C23 19.5 27 18 27.5 14.5Z"
        stroke={`url(#${grad})`}
        strokeWidth={simple ? 3.8 : 2.4}
        strokeLinejoin="round"
      />
      <path d="M24 61V33H42V38H29.6V44.2H38.6V49.2H29.6V61Z" fill={`url(#${grad})`} />
    </svg>
  );
}

// La "A" de la marca: un arco ogival con travesaño. Se dibuja en `em` para que
// acompañe el tamaño y el peso de las letras que la rodean.
function ArcoA({ ultima = false }) {
  return (
    <svg
      viewBox="0 0 16 18"
      aria-hidden="true"
      fill="none"
      style={{ width: '0.62em', height: '0.72em', marginRight: ultima ? 0 : '0.32em' }}
    >
      <path
        d="M2.2 18V7.6C2.2 4.6 5 2.2 8 0.2C11 2.2 13.8 4.6 13.8 7.6V18M2.2 12.6H13.8"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}

/** FRAGANZIA con las tres "A" en forma de arco: el arco es la firma de la marca. */
export function NombreFraganzia({ className = '', style }) {
  return (
    <span
      role="img"
      aria-label="Fraganzia"
      className={`inline-flex items-baseline font-display font-medium ${className}`}
      style={{ letterSpacing: '0.32em', ...style }}
    >
      <span aria-hidden="true">FR</span>
      <ArcoA />
      <span aria-hidden="true">G</span>
      <ArcoA />
      <span aria-hidden="true">NZI</span>
      <ArcoA ultima />
    </span>
  );
}

/**
 * Logo de Fraganzia: símbolo + nombre.
 *
 * El tamaño sale de la variable CSS `--logo-scale` (1 = símbolo de 34px de
 * alto), así se puede cambiar por breakpoint con una sola pieza, por ejemplo
 * className="[--logo-scale:1.5] sm:[--logo-scale:2]". `size` fija la escala
 * inicial cuando no se pasa por className.
 * `subtitulo` agrega "Perfumes árabes" debajo del nombre (pie de página).
 */
export function LogoFraganzia({ size = 1, className = '', subtitulo = false }) {
  return (
    <div
      className={`flex items-center select-none ${className}`}
      style={{ lineHeight: 1, gap: 'calc(11px * var(--logo-scale, 1))', ...(className.includes('--logo-scale') ? {} : { '--logo-scale': size }) }}
    >
      <MarcaFraganzia
        simple={size < 1.3 && !subtitulo}
        className="shrink-0"
        style={{ height: 'calc(34px * var(--logo-scale, 1))', width: 'calc(34px * 64 / 76 * var(--logo-scale, 1))' }}
      />
      <div className="flex flex-col">
        <NombreFraganzia className="text-text" style={{ fontSize: 'calc(16px * var(--logo-scale, 1))' }} />
        {subtitulo && (
          <span
            className="font-display font-normal uppercase text-lila"
            style={{ fontSize: 'calc(8.5px * var(--logo-scale, 1))', letterSpacing: '0.5em', marginTop: 'calc(7px * var(--logo-scale, 1))' }}
          >
            Perfumes árabes
          </span>
        )}
      </div>
    </div>
  );
}
