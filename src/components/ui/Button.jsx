const VARIANTS = {
  primary: 'boton-principal',
  secondary: 'boton-contorno',
  ghost: 'text-text-secondary hover:text-text',
};

/**
 * Botón de las páginas internas: píldora, como los del Home. `primary` = la acción de la pantalla (una por vista),
 * `secondary` = contorno lila, `ghost` = solo texto. `size="chico"` para botones dentro de filas y tarjetas.
 */
export function Button({ variant = 'primary', size, className = '', children, ...props }) {
  return (
    <button className={`boton ${VARIANTS[variant]} ${size === 'chico' ? 'boton-chico' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
