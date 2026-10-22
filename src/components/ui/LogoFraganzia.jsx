import { useId } from 'react';
import { COLA_PATH, DISCO_LISO, F_PATH, GOTA, LACRE_FINO } from './selloPath';

/**
 * Sello de Fraganzia: disco violeta con borde de lacre y una F con estela. La F está calada
 * (máscara), así que se ve el fondo de la página a través de ella. `simple` usa el borde liso,
 * que aguanta mejor los tamaños chicos.
 */
export function SelloFraganzia({ className = '', simple = false, style }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className={className} style={style}>
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1="8" y1="6" x2="72" y2="74">
          <stop offset="0" stopColor="#F1E3FF" />
          <stop offset=".45" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7B2FBE" />
        </linearGradient>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
          <rect width="80" height="80" fill="#fff" />
          <g fill="#000">
            <path d={F_PATH} />
            <path d={COLA_PATH} />
            <circle cx={GOTA.cx} cy={GOTA.cy} r={GOTA.r} />
          </g>
        </mask>
      </defs>
      <path d={simple ? DISCO_LISO : LACRE_FINO} fill={`url(#g${id})`} mask={`url(#m${id})`} />
    </svg>
  );
}

/**
 * Logo de Fraganzia: sello + nombre. El nombre es texto real (lo leen buscadores, lectores de
 * pantalla y agentes de IA) en Outfit negrita con mucho espaciado.
 *
 * El tamaño sale de la variable CSS `--logo-scale` (1 = sello de 44px), así se puede cambiar por
 * breakpoint con una sola pieza, por ejemplo className="[--logo-scale:0.85] lg:[--logo-scale:1.15]".
 * `size` fija la escala inicial cuando no se pasa por className.
 * `subtitulo` agrega "Perfumes árabes" debajo del nombre (pie de página).
 */
export function LogoFraganzia({ size = 1, className = '', subtitulo = false }) {
  return (
    <div
      className={`flex items-center select-none ${className}`}
      style={{
        lineHeight: 1,
        gap: 'calc(12px * var(--logo-scale, 1))',
        ...(className.includes('--logo-scale') ? {} : { '--logo-scale': size }),
      }}
    >
      <SelloFraganzia
        simple={size < 0.8}
        className="shrink-0"
        style={{ width: 'calc(44px * var(--logo-scale, 1))', height: 'calc(44px * var(--logo-scale, 1))' }}
      />
      <div className="flex flex-col">
        <span
          className="font-display font-bold text-text"
          style={{ fontSize: 'calc(17px * var(--logo-scale, 1))', letterSpacing: '0.26em' }}
        >
          FRAGANZIA
        </span>
        {subtitulo && (
          <span
            className="font-display font-normal uppercase text-lila"
            style={{ fontSize: 'calc(9px * var(--logo-scale, 1))', letterSpacing: '0.5em', marginTop: 'calc(7px * var(--logo-scale, 1))' }}
          >
            Perfumes árabes
          </span>
        )}
      </div>
    </div>
  );
}
