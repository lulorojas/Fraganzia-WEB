/**
 * Logo Fraganzia — foto de perfil real + texto FRAGANZIA
 *
 * El tamaño sale de la variable CSS `--logo-scale` (1 = ícono de 36px), así se
 * puede cambiar por breakpoint con una sola imagen, por ejemplo
 * className="[--logo-scale:2.5] sm:[--logo-scale:3.5]". `size` fija la escala
 * inicial cuando no se pasa por className. Si el tamaño cambia por breakpoint,
 * pasá también `sizes` con los anchos reales del ícono (el atributo `sizes`
 * no entiende variables CSS y sin él el navegador bajaría la imagen más grande).
 */
export function LogoFraganzia({ size = 1, className = '', priority = false, sizes }) {
  const iconPx = Math.round(36 * size);

  return (
    <div
      className={`flex items-center gap-2.5 select-none ${className}`}
      style={{ lineHeight: 1, ...(className.includes('--logo-scale') ? {} : { '--logo-scale': size }) }}
    >
      <img
        src="/logo-192.webp"
        srcSet="/logo-96.webp 96w, /logo-192.webp 192w, /logo-256.webp 256w"
        sizes={sizes ?? `${iconPx}px`}
        alt=""
        width={iconPx}
        height={iconPx}
        fetchpriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
        className="rounded-full object-cover"
        style={{ width: 'calc(36px * var(--logo-scale, 1))', height: 'calc(36px * var(--logo-scale, 1))' }}
      />
      <span
        className="font-logo font-bold text-text"
        style={{ fontSize: 'calc(17px * var(--logo-scale, 1))', letterSpacing: '0.13em' }}
      >
        FRAGANZIA
      </span>
    </div>
  );
}
