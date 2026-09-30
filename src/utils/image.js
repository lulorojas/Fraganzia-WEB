import locales from '../data/imagenes-locales.json';
import { hashTexto } from './hash';

// Hashes de las fotos que tools/localizar-imagenes.mjs ya descargó y optimizó.
const LOCALES = new Set(locales);

export const PLACEHOLDER_PERFUME = '/placeholder-perfume.svg';

/**
 * Fuentes para mostrar una foto de producto. Si hay copia local optimizada
 * (WebP a 400 y 800 px), usa esa con `srcSet` para que el navegador elija el
 * tamaño; si no (foto recién cargada desde el admin, todavía sin localizar),
 * usa la URL original.
 */
export function fuentesImagen(url) {
  if (!url) return { src: PLACEHOLDER_PERFUME };
  const hash = hashTexto(url);
  if (!LOCALES.has(hash)) return { src: url };
  return {
    src: `/img/p/${hash}-400.webp`,
    srcSet: `/img/p/${hash}-400.webp 400w, /img/p/${hash}-800.webp 800w`,
  };
}

/** URL absoluta de la mejor versión de una foto (para Open Graph / JSON-LD). */
export function imagenGrande(url) {
  if (!url) return undefined;
  const hash = hashTexto(url);
  return LOCALES.has(hash) ? `/img/p/${hash}-800.webp` : url;
}
