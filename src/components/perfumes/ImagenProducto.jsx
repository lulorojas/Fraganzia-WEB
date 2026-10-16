import { fuentesImagen, PLACEHOLDER_PERFUME } from '../../utils/image';

/**
 * Foto de producto: copia local optimizada si existe, tamaño según `sizes`, y
 * placeholder si la imagen falla (por ejemplo, una URL externa que dejó de
 * existir) en lugar del ícono de imagen rota.
 *
 * `prioridad`: la foto se ve apenas carga la página (suele ser el LCP), así
 * que se pide ya y con prioridad alta en vez de esperar al scroll.
 */
export function ImagenProducto({ url, alt = '', sizes, width, height, prioridad = false, className = '' }) {
  const { src, srcSet } = fuentesImagen(url);

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchpriority={prioridad ? 'high' : undefined}
      decoding="async"
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallo) return;
        img.dataset.fallo = '1';
        img.removeAttribute('srcset');
        img.src = PLACEHOLDER_PERFUME;
      }}
    />
  );
}
