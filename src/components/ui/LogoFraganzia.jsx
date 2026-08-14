/**
 * Logo Fraganzia — foto de perfil real + texto FRAGANZIA
 */
export function LogoFraganzia({ size = 1, className = '' }) {
  const iconPx = Math.round(36 * size);
  const textPx = Math.round(17 * size);

  return (
    <div
      className={`flex items-center gap-2.5 select-none ${className}`}
      style={{ lineHeight: 1 }}
    >
      <img
        src="/logo-fraganzia-crop.png"
        alt="Fraganzia"
        width={iconPx}
        height={iconPx}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
      />
      <span
        style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: `${textPx}px`,
          fontWeight: 700,
          letterSpacing: '0.13em',
          color: '#F8F4FF',
        }}
      >
        FRAGANZIA
      </span>
    </div>
  );
}
