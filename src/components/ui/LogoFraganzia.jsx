import { useId } from 'react';

/**
 * Monograma: un arco de mihrab (la arquitectura que enmarca la caligrafía y la
 * perfumería oriental) con una F adentro. Lila en degradé, sin serifas.
 * `simple` saca el arco interior fino para que aguante tamaños chicos.
 */
export function MarcaFraganzia({ className = '', simple = false, style }) {
  const id = useId();
  const oro = `oro-${id.replace(/:/g, '')}`;
  return (
    <svg
      viewBox="0 0 64 76"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={oro} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D5FF" />
          <stop offset=".5" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7B2FBE" />
        </linearGradient>
      </defs>
      <path
        d="M6 72V34C6 20 19 11 32 3C45 11 58 20 58 34V72"
        stroke={`url(#${oro})`}
        strokeWidth={simple ? 3.6 : 2.2}
        strokeLinejoin="round"
      />
      {!simple && (
        <path
          d="M12 72V35C12 23 23 15.5 32 9.5C41 15.5 52 23 52 35V72"
          stroke={`url(#${oro})`}
          strokeWidth=".9"
          opacity=".55"
          strokeLinejoin="round"
        />
      )}
      <path d="M24 56V30H42V34.5H29.5V41H38.5V45.5H29.5V56Z" fill={`url(#${oro})`} />
    </svg>
  );
}

/**
 * Logo de Fraganzia: monograma + nombre en Outfit con mucho espaciado.
 *
 * El tamaño sale de la variable CSS `--logo-scale` (1 = monograma de 34px de
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
        <span
          className="font-display font-medium text-text"
          style={{ fontSize: 'calc(16px * var(--logo-scale, 1))', letterSpacing: '0.32em', marginRight: '-0.32em' }}
        >
          FRAGANZIA
        </span>
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
